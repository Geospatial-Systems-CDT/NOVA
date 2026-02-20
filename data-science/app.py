# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

# Import libraries
from flask import Flask, render_template, jsonify, request
import geopandas as gpd
from shapely.geometry import Polygon, Point, MultiPolygon
import pandas as pd
import numpy as np
import random
import json
import os

# Algorithm libraries
from pyswarm import pso
from scipy.optimize import differential_evolution
from deap import base, creator, tools, algorithms

app = Flask(__name__)

# Define Coordinate Reference Systems
CRS_WGS84 = "EPSG:4326"
CRS_PROJECTED = "EPSG:27700" 

# --- Generate demo data. Not needed now as we are using real Scotland area data for NOVA ---
def create_demo_data():
    """
    Generates four separate GeoJSON files for each data layer,
    including a 'name' property for tooltips.
    """
    print("Generating demo data files...")
    
    # Protected Areas
    protected_features = []
    for i in range(100):
        center = Point(random.uniform(-6, -2), random.uniform(55, 58))
        poly = center.buffer(random.uniform(0.05, 0.15))
        gdf = gpd.GeoDataFrame([1], geometry=[poly], crs=CRS_WGS84)
        feature = gdf.__geo_interface__['features'][0]
        feature['properties'] = {'name': f'Protected Area #{i+1}'}
        protected_features.append(feature)
    with open("protected_areas.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": protected_features}, f)
    print("  - protected_areas.geojson created.")

    # Residential Areas
    residential_features = []
    for i in range(100):
        center = Point(random.uniform(-5, -1.5), random.uniform(56, 59))
        poly = center.buffer(random.uniform(0.02, 0.08))
        gdf = gpd.GeoDataFrame([1], geometry=[poly], crs=CRS_WGS84)
        feature = gdf.__geo_interface__['features'][0]
        feature['properties'] = {'name': f'Residential Area #{i+1}'}
        residential_features.append(feature)
    with open("residential_areas.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": residential_features}, f)
    print("  - residential_areas.geojson created.")

    # Grid Supply Points
    grid_features = []
    for i in range(150):
        point = Point(random.uniform(-7, -1.5), random.uniform(55, 60))
        gdf = gpd.GeoDataFrame([1], geometry=[point], crs=CRS_WGS84)
        feature = gdf.__geo_interface__['features'][0]
        feature['properties'] = {'name': f'Grid Point #{i+1}'}
        grid_features.append(feature)
    with open("grid_supply_points.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": grid_features}, f)
    print("  - grid_supply_points.geojson created.")

    # Wind Speeds
    wind_features = []
    for i in range(1000):
        point = Point(random.uniform(-7.5, -1.4), random.uniform(54.6, 60.9))
        gdf = gpd.GeoDataFrame([1], geometry=[point], crs=CRS_WGS84)
        feature = gdf.__geo_interface__['features'][0]
        speed = round(random.uniform(4.0, 8.0), 2)
        feature['properties'] = {'name': f'Wind Speed: {speed} m/s', 'speed': speed}
        wind_features.append(feature)
    with open("wind_speeds.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": wind_features}, f)
    print("  - wind_speeds.geojson created.")
    print("All demo data files generated successfully.")


# --- Cost function definition ---
def calculate_solution_cost(particle, *args):
       
    drawn_polygon_proj, protected_proj, residential_proj, grid_supply_proj, wind_speeds_proj = args
    total_cost = 0; num_turbines = len(particle) // 2
    if num_turbines == 0: return float('inf')
    weights = {'grid': 0.4, 'protected': 0.2, 'residential': 0.2, 'wind': 0.2}
    for i in range(0, len(particle), 2):
        turbine_loc = Point(particle[i], particle[i+1])
        dist_to_grid = grid_supply_proj.distance(turbine_loc)
        dist_to_residential = residential_proj.distance(turbine_loc)
        dist_to_protected = protected_proj.distance(turbine_loc)
        #wind_speed = wind_speeds_proj.loc[wind_speeds_proj.distance(turbine_loc).idxmin()]['speed']
        wind_speed = wind_speeds_proj.loc[wind_speeds_proj.distance(turbine_loc).idxmin()]['ws_spring_']
        if not drawn_polygon_proj.contains(turbine_loc) or dist_to_grid > 2000.0 or dist_to_residential < 2000.0 or dist_to_protected < 1000.0 or wind_speed < 4.0:
            return float('inf')
        cost_grid = dist_to_grid / 2000.0; cost_protected = max(0, 1 - (dist_to_protected / 1000.0)); cost_residential = max(0, 1 - (dist_to_residential / 2000.0)); cost_wind = 1 - ((wind_speed - 4.0) / (8.0 - 4.0))
        total_cost += (weights['grid'] * cost_grid + weights['protected'] * cost_protected + weights['residential'] * cost_residential + weights['wind'] * cost_wind)
    return total_cost / num_turbines if num_turbines > 0 else float('inf')

def ga_evaluate(individual, *args):
    return (calculate_solution_cost(list(individual), *args),)


def pso_de_objective_function(particle, *args):
    """Wrapper for pyswarm and scipy's DE. Returns a float."""
    if np.isnan(np.array(particle)).any(): return float('inf')
    return calculate_solution_cost(particle, *args)

def compute_rag_score(dist_grid, dist_residential, dist_protected, wind_speed):
    # Constraint weights
    weights = {
        'wind': 0.4,
        'grid': 0.3,
        'residential': 0.15,
        'protected': 0.15
    }

    # Wind score: [4 m/s, 8 m/s] → [0, 1]
    wind_score = max(0, min(1, (wind_speed - 4.0) / 4.0))

    # Grid distance score: ≤2000m is ideal
    grid_score = max(0, 1 - (dist_grid / 2000.0))

    # Residential distance score: ≥2000m is good
    residential_score = max(0, min(1, (dist_residential - 2000.0) / 3000.0))

    # Protected distance score: ≥1000m is good
    protected_score = max(0, min(1, (dist_protected - 1000.0) / 4000.0))

    # Weighted score (0–1)
    final_score = (
        weights['wind'] * wind_score +
        weights['grid'] * grid_score +
        weights['residential'] * residential_score +
        weights['protected'] * protected_score
    )

    # Scale to 0–10 and round
    rag_score = round(final_score * 10)

    # RAG color classification
    if rag_score <= 3:
        rag_color = "red"
    elif rag_score > 3 and rag_score < 7:
        rag_color = "amber"
    else:
        rag_color = "green"

    return rag_score, rag_color


def get_point_analysis(point_proj, *args):
    
    drawn_polygon_proj, protected_proj, residential_proj, grid_supply_proj, wind_speeds_proj = args
    dist_grid = round(grid_supply_proj.distance(point_proj)); dist_residential = round(residential_proj.distance(point_proj)); dist_protected = round(protected_proj.distance(point_proj)); wind_speed = wind_speeds_proj.loc[wind_speeds_proj.distance(point_proj).idxmin()]['ws_spring_']
    reasons = []; is_valid = True
    if dist_grid <= 2000.0: reasons.append("✅ Grid: Within 2000m")
    else: reasons.append("❌ Grid: > 2000m"); is_valid = False
    if dist_residential >= 2000.0: reasons.append("✅ Residential: > 2000m")
    else: reasons.append("❌ Residential: < 2000m"); is_valid = False
    if dist_protected >= 1000.0: reasons.append("✅ Protected: > 1000m")
    else: reasons.append("❌ Protected: < 1000m"); is_valid = False
    if wind_speed >= 4.0: reasons.append(f"✅ Wind Speed: {wind_speed} m/s (>= 4 m/s)")
    else: reasons.append(f"❌ Wind Speed: {wind_speed} m/s (< 4 m/s)"); is_valid = False
    if not drawn_polygon_proj.contains(point_proj): reasons.append("❌ Outside drawn polygon"); is_valid = False
    fitness = 0
    if is_valid: 
        cost = pso_de_objective_function(np.array([point_proj.x, point_proj.y]), *args)
        fitness = 1 - cost if cost != float('inf') else 0
    # rag_score = round(fitness * 10)
    # rag_color = "green" if rag_score > 7 else "amber"
    # if rag_score <= 3 or not is_valid: rag_color = "red"
    rag_score, rag_color = compute_rag_score(dist_grid, dist_residential, dist_protected, wind_speed)

    return fitness, rag_score, rag_color, reasons

def clpso(objective_func, bounds, args=(), num_particles=30, max_iter=100, w=0.5, c=1.5):
    dim = len(bounds)
    lb = np.array([b[0] for b in bounds])
    ub = np.array([b[1] for b in bounds])

    # Initialize
    position = np.random.uniform(lb, ub, (num_particles, dim))
    velocity = np.zeros_like(position)
    pbest = np.copy(position)
    pbest_fitness = np.array([objective_func(p, *args) for p in pbest])
    best_idx = np.argmin(pbest_fitness)
    gbest = pbest[best_idx]

    def choose_exemplars(pbest):
        N, D = pbest.shape
        exemplars = np.zeros_like(pbest)
        for i in range(N):
            for d in range(D):
                j = np.random.choice([k for k in range(N) if k != i])
                exemplars[i, d] = pbest[j, d]
        return exemplars

    for _ in range(max_iter):
        fitness = np.array([objective_func(p, *args) for p in position])
        improved = fitness < pbest_fitness
        pbest[improved] = position[improved]
        pbest_fitness[improved] = fitness[improved]
        best_idx = np.argmin(pbest_fitness)
        gbest = pbest[best_idx]
        exemplars = choose_exemplars(pbest)
        r = np.random.rand(num_particles, dim)
        velocity = w * velocity + c * r * (exemplars - position)
        position += velocity
        position = np.clip(position, lb, ub)

    best_idx = np.argmin(pbest_fitness)
    return pbest[best_idx], pbest_fitness[best_idx]

# --- Flask Routes ---
@app.route('/')
def index(): return render_template('index.html')

@app.route('/get_data')
def get_data():
    all_layers = {}
    layer_files = {
        'protected': './data/protected_areas.geojson',
        'residential': './data/residential_areas.geojson',
        'grid': './data/grid_supply_points.geojson',
        'wind': './data/wind_speeds.geojson'
    }
    for name, filename in layer_files.items():
        try:
            with open(filename) as f:
                all_layers[name] = json.load(f)
        except FileNotFoundError:
            return jsonify({"error": f"Data file '{filename}' not found. Please run the data generation script."}), 404
    return jsonify(all_layers)

@app.route('/optimise', methods=['POST'])
def optimise():
    data = request.get_json(); algorithm = data.get('algorithm', 'pso')
    try:
        protected_gdf = gpd.read_file('./data/protected_areas.geojson', crs=CRS_WGS84).to_crs(CRS_PROJECTED)
        residential_gdf = gpd.read_file('./data/residential_areas.geojson', crs=CRS_WGS84).to_crs(CRS_PROJECTED)
        grid_supply_gdf = gpd.read_file('./data/grid_supply_points.geojson', crs=CRS_WGS84).to_crs(CRS_PROJECTED)
        wind_speeds_gdf = gpd.read_file('./data/wind_speeds.geojson', crs=CRS_WGS84).to_crs(CRS_PROJECTED)
    except Exception as e:
        return jsonify({"error": f"Could not read data files: {e}. Please run the data generation script."}), 500

    protected_proj = protected_gdf.unary_union
    residential_proj = residential_gdf.unary_union
    grid_supply_proj = grid_supply_gdf.unary_union
    wind_speeds_proj = wind_speeds_gdf.reset_index(drop=True)
    drawn_poly_proj_geom = gpd.GeoDataFrame([{'geometry': Polygon(data['polygon']['geometry']['coordinates'][0])}], crs=CRS_WGS84).to_crs(CRS_PROJECTED).geometry.iloc[0]
    if not data['turbines']['features']: return jsonify({"error": "No turbines to optimise."}), 400
    initial_turbines_proj_gdf = gpd.GeoDataFrame.from_features(data['turbines']['features'], crs=CRS_WGS84).to_crs(CRS_PROJECTED)
    
    num_turbines = len(initial_turbines_proj_gdf)
    minx, miny, maxx, maxy = drawn_poly_proj_geom.bounds
    bounds = [(minx, maxx) if i % 2 == 0 else (miny, maxy) for i in range(num_turbines * 2)]
    lb = [b[0] for b in bounds]; ub = [b[1] for b in bounds]
    args = (drawn_poly_proj_geom, protected_proj, residential_proj, grid_supply_proj, wind_speeds_proj)
    xopt, fopt = None, float('inf')

    if algorithm == 'pso': xopt, fopt = pso(pso_de_objective_function, lb, ub, args=args, swarmsize=100, maxiter=150)
    elif algorithm == 'de':
        result = differential_evolution(pso_de_objective_function, bounds, args=args, maxiter=100, popsize=15, mutation=(0.5, 1), recombination=0.7, disp=False)
        xopt, fopt = result.x, result.fun

    elif algorithm == 'clpso':
        xopt, fopt = clpso(
            objective_func=pso_de_objective_function,
            bounds=bounds,
            args=args,
            num_particles=100,
            max_iter=150
    )

    elif algorithm == 'ga':
       
        if hasattr(creator, "FitnessMin"): del creator.FitnessMin
        if hasattr(creator, "Individual"): del creator.Individual
        
        creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMin)
        
        toolbox = base.Toolbox()
        
        # Register functions to create a flat list of attributes for the individual
        attr_list = []
        for i in range(num_turbines * 2):
            low, high = bounds[i]
            toolbox.register(f"attr_{i}", random.uniform, low, high)
        
        attr_tuple = tuple(getattr(toolbox, f"attr_{i}") for i in range(num_turbines * 2))
        
        toolbox.register("individual", tools.initCycle, creator.Individual, attr_tuple, n=1)
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)

        # Register evaluation function
        toolbox.register("evaluate", lambda ind: ga_evaluate(ind, *args))
        # toolbox.register("evaluate", ga_evaluate, *args)
        
        toolbox.register("mate", tools.cxBlend, alpha=0.5)
        toolbox.register("mutate", tools.mutGaussian, mu=0, sigma=100, indpb=0.1)
        toolbox.register("select", tools.selTournament, tournsize=20)
        
        pop = toolbox.population(n=300)
        hof = tools.HallOfFame(1)
        algorithms.eaSimple(pop, toolbox, cxpb=0.7, mutpb=0.5, ngen=150, halloffame=hof, verbose=False)
        if hof: xopt, fopt = hof[0], hof[0].fitness.values[0]

    elif algorithm == 'aco' or algorithm == 'grid_search':
        grid_size = 10 if algorithm == 'aco' else 20
        best_cost, best_point = float('inf'), None
        x_points, y_points = np.linspace(minx, maxx, grid_size), np.linspace(miny, maxy, grid_size)
        for x in x_points:
            for y in y_points:
                particle = [c for _ in range(num_turbines) for c in (x,y)]; cost = pso_de_objective_function(particle, *args)
                if cost < best_cost: best_cost, best_point = cost, particle
        xopt, fopt = best_point, best_cost

    if fopt == float('inf') or xopt is None:
        return jsonify({"error": "No valid location could be found. The chosen algorithm failed to find a solution satisfying all hard constraints within the polygon. Please try a larger area or a different algorithm."}), 400

    optimised_locations = []
    new_proj_points = [Point(xopt[i], xopt[i+1]) for i in range(0, len(xopt), 2)]
    optimised_gdf_proj = gpd.GeoDataFrame(geometry=new_proj_points, crs=CRS_PROJECTED)
    optimised_gdf_wgs84 = optimised_gdf_proj.to_crs(CRS_WGS84); initial_turbines_wgs84 = initial_turbines_proj_gdf.to_crs(CRS_WGS84)
    original_stats = [{'dist_protected_m': round(protected_proj.distance(p)), 'dist_residential_m': round(residential_proj.distance(p)), 'dist_grid_m': round(grid_supply_proj.distance(p)), 'wind_speed': wind_speeds_proj.loc[wind_speeds_proj.distance(p).idxmin()]['ws_spring_']} for p in initial_turbines_proj_gdf.geometry]
    for i, row in optimised_gdf_wgs84.iterrows():
        new_point_proj = optimised_gdf_proj.geometry.iloc[i]; fitness, rag_score, rag_color, reasons = get_point_analysis(new_point_proj, *args)
        optimised_locations.append({'new_coords': [row.geometry.y, row.geometry.x], 'original_coords': [initial_turbines_wgs84.geometry.iloc[i].y, initial_turbines_wgs84.geometry.iloc[i].x], 'optimised_wind_speed': wind_speeds_proj.loc[wind_speeds_proj.distance(new_point_proj).idxmin()]['ws_spring_'], 'optimised_dist_protected_m': round(protected_proj.distance(new_point_proj)), 'optimised_dist_residential_m': round(residential_proj.distance(new_point_proj)), 'optimised_dist_grid_m': round(grid_supply_proj.distance(new_point_proj)), 'original_wind_speed': original_stats[i]['wind_speed'], 'original_dist_protected_m': original_stats[i]['dist_protected_m'], 'original_dist_residential_m': original_stats[i]['dist_residential_m'], 'original_dist_grid_m': original_stats[i]['dist_grid_m'], 'probability': round(fitness, 3), 'rag_score': f"{rag_score}/10", 'rag_color': rag_color, 'reasoning': reasons})
    return jsonify({'optimised_locations': optimised_locations, 'overall_probability': round(1 - fopt if fopt != float('inf') else 0, 3)})


@app.route('/export_optimisation', methods=['POST'])
def export_optimisation():
    data = request.get_json(); export_format = data.get('format', 'geojson'); df = pd.DataFrame(data['data'])
    if export_format == 'csv': headers = {"Content-Type": "text/csv", "Content-Disposition": "attachment; filename=optimised_locations.csv"}; return df.to_csv(index=False), 200, headers
    gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df.new_lon, df.new_lat)); headers = {"Content-Type": "application/json", "Content-Disposition": "attachment; filename=optimised_locations.geojson"}; return gdf.to_json(), 200, headers
@app.route('/export_polygon', methods=['POST'])
def export_polygon():
    data = request.get_json(); export_format = data.get('format', 'geojson'); geojson_data = data.get('geojson')
    if not geojson_data: return jsonify({"error": "No GeoJSON data provided"}), 400
    if export_format == 'geojson': headers = {"Content-Type": "application/json", "Content-Disposition": "attachment; filename=polygon_export.geojson"}; return jsonify(geojson_data), 200, headers
    if export_format == 'csv':
        records = [{'type': f.get('properties', {}).get('type'), 'geometry_type': f.get('geometry', {}).get('type'), 'coordinates': json.dumps(f.get('geometry', {}).get('coordinates')), 'wind_speed': f.get('properties', {}).get('speed')} for f in geojson_data.get('features', [])]
        if not records: return "No features to export", 200
        df = pd.DataFrame(records); headers = {"Content-Type": "text/csv", "Content-Disposition": "attachment; filename=polygon_export.csv"}; return df.to_csv(index=False), 200, headers
    return jsonify({"error": "Unsupported format"}), 400

if __name__ == '__main__':
    # Create demo data to be run once if data is not available
    # create_demo_data() 
    app.run(debug=True)
