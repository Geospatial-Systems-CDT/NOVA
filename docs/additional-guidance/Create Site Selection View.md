# Create Site Selection View

This article covers the steps needed to generate a Site selection view using the data described in [Data Download and Preparation](Data%20Download%20and%20Preparation.md).

## Site Selection Requirements

The following constraints have been added to the NOVA proof of concept demonstrator for the placement of wind turbines.

- 2km from Residential Areas
- Average windspeed must be above 4 m/s
- 2km from Protected Areas
- Within 2km of a Grid Supply Point

For now all prepared data is being stored as Geojson files using the OSGB National grid co-ordinate reference system (ESPG: 27700). Geospatial actions have been undertaken in QGIS, in the future I recommend these functions are handled in a PostGIS database.

## 2km from Residential Areas

In order to obtain a 2km radius from each of the residential areas the polygons are buffered using the buffer tool within QGIS.

![image-20250617-130809.png](attachments/94c014fe-151d-49dd-a74a-6052c11343f0.png)

The following out put is produced:

![image-20250617-130948.png](attachments/a787a9fd-4da0-47b3-bde7-f0c345f5e3af.png)

To give a more graduated feel a further buffer is created at 1km and added to the other layers:

![image-20250617-131108.png](attachments/73a61ec6-a80f-4b48-8973-84bec2c785e5.png)

These layers are added to the map using 50% opacity with a red amber yellow colour pallet.

## Windspeed above 4m/s

A simple filter on the windspeed is used to identify areas where the windspeed meets the constraints, these are then added to the map and displayed in green using 50% opacity.

![image-20250617-131535.png](attachments/1dca618f-a5ca-43a5-b2a7-8c1e9ea7bfd7.png)

The same process is then ran in reverse to identify areas where windspeed does not meet the criteria. These are displayed in amber using 50% opacity.

![image-20250617-131759.png](attachments/488cbb80-d5b6-4308-923b-dbdee3468254.png)

## 2km from Protected Areas

In order to obtain a 2km radius from each of the protected areas the polygons are buffered using the buffer tool within QGIS.

The process is exactly the same as the one for residential areas within this article. with the following output.

![image-20250617-132105.png](attachments/fd9168bd-d76a-44cb-8034-9300e4b0d364.png)

## Within 2km of a Grid supply point

Again using the buffer tool within QGIS the point features for Grid supply points are buffered by 2km, giving the following result.

![image-20250617-132400.png](attachments/78a40f46-54f0-41fe-a087-6e334835008b.png)

## Site Selection View

These separate layers are then ordered as shown:

![image-20250617-132547.png](attachments/36d2f0e8-3ddb-430f-a192-5a73c2072d77.png)

This creates the following view.

![image-20250617-132704.png](attachments/9855ad46-e54f-4bf9-ba23-cad03cf9be07.png)

From the above image the optimal location would be around the west side of the grid supply point shown furthest west on the above map.
