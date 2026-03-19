
# Data Download and Preparation

This article covers the steps needed to download and process data to be used in the NOVA proof of concept demonstrator.

## **Data requirements:**

- Elevation
- Residential areas
- Average windspeed
- Grid supply points
- Protected areas

It’s important to understand the level of accuracy when using global projection systems such as WGS 1984 reduces the further you are from the equator. Great Britan covers multiple UTM grid zones so we cannot project data to one zone.

So, reduce distortion and provide more accurate analysis values we will be using the OSGB National grid co-ordinate reference system (ESPG: 27700).

## Elevation Data

To meet the requirements outlined in the project we have selected to use 1 and 2 metre resolution lidar composite tiles supplied from the government data services platform. This dataset is published by the environment agency. The tiles we are processing come from the LIDAR Composite Digital Terrain Model (DTM).

Downloaded from:

<https://environment.data.gov.uk/dataset/13787b9a-26a4-4775-8523-806d13af58fc>

![image-20250609-095222.png](attachments/66aa789f-73eb-40a4-bb19-931ae1ce2b6b.png)

The data is downloaded for 1m resolution tiles where possible, the data is then validated and checked within Quantum GIS (QGIS).

![image-20250610-092225.png](attachments/a02d8acb-9630-46c8-961d-e29f2f9c7da0.png)

As the image above shows we are missing 2 tiles of 1m LIDAR data for the Isle of Wight these missing tiles will need to be downloaded at 2m resolution to fill the gaps.

![image-20250610-092824.png](attachments/ef2fa01b-9390-4b8b-8410-fd377b1eb662.png)

These 2m patches are then merged with the existing tiles to form a composite Digital Terrain Model with full coverage of the Ilse Of Wight.

![image-20250610-093213.png](attachments/bb56ffac-e913-43a2-8c52-20624ea64840.png)

This layer is then exported using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system and exported to the AWS S3 bucket **537124944113-nova-datascience** to be shared with the NOVA developers (note this layer is 1GB in size).

## Residential Areas

For this piece of work we are using the OS Open Data Built Up Areas dataset. OS Open Built Up Areas represents the built-up areas of Great Britain equal to or greater than 200,000m² or 20 hectares and they include unique names, alternative language names and GSS codes.

Download from:

[OS Data downloads | OS Data Hub](https://osdatahub.os.uk/downloads/open/BuiltUpAreas)

![image-20250610-100537.png](attachments/3200f389-883c-4272-a16f-8acc422f886f.png)

The following attribution fields are available for analysis:

![image-20250610-101059.png](attachments/1d7028e6-5acf-494b-a0bb-ae4f611c53f9.png)

This dataset is downloaded as a GeoPackage and exported to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system and exported to the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

## Windspeed

We are currently using the Seasonal Average Wind Speed - Projections (5km) dataset provided by the UK Met office. This dataset contains seasonal averages of wind speeds on a 5km British National Grid (BNG). Here, the seasons are defined as winter (December, January and February), spring (March, April and May), summer (June, July and August) and autumn (September, October and November). The averages are calculated using 20 years of data for different time periods. The wind speeds reflect those at a height of 10 m above local ground level.

Download From:

[Seasonal Average Wind Speed - Projections (5km) | The Met Office climate data portal](https://climatedataportal.metoffice.gov.uk/datasets/seasonal-average-wind-speed-projections-5km/explore?location=52.889953%2C-3.309202%2C5.47)

![image-20250610-104158.png](attachments/864b85c7-4525-473d-8383-5315cfc851aa.png)

Attribution for this dataset is plentiful, when referring back to the met office site it shows that all ws\_\*\*\*\*1 fields relate to the windspeed spring baseline median. I recommend these average value fields for the analysis.

![Screenshot 2025-06-10 114637.jpg](attachments/8c527e51-dfb4-4124-9088-c91dc5a5033f.jpg)

This dataset is downloaded as a Shapefile and exported to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system and exported to the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

## Grid Supply Points

In order to find a data set that provides best coverage of the Isle of Wight we chose to use the Scottish and Southern Electricity Networks substation data. This dataset provides details of SSEN Substations, their type and identification and location coordinates for both SEPD and SHEPD licence areas provided in csv format.

Download from:

[Data Assets](https://data.ssen.co.uk/search?q=grid+supply)

As the data is in csv format it is converted to a layer using the add spreadsheet layer for QGIS.

![image-20250610-122837.png](attachments/cac72e5a-e202-4bc4-9d76-babbf84d8eea.png)

The layer provides details on all substations including distribution stations so must be filtered by type in the following way.

![image-20250610-123040.png](attachments/83c0386f-249a-4d8a-96fe-6248c43425a2.png)

This returns only the values we could consider as grid supply points.

![image-20250610-123147.png](attachments/5537b213-f4a2-442f-a39f-a3b0ad82dd1f.png)

This dataset is downloaded as a CSV this is converted and filtered before being exported to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system and exported to the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

## Protected Areas

The following features are considered protected areas within the UK (with Download links):

- Areas of outstanding natural beauty

  - <https://naturalengland-defra.opendata.arcgis.com/datasets/6f2ad07d91304ad79cdecd52489d5046_0/about>
- Sites of Special Scientific Interest

  - <https://naturalengland-defra.opendata.arcgis.com/datasets/sites-of-special-scientific-interest-england/explore>
- Special Areas of Conservation

  - <https://hub.jncc.gov.uk/assets/52b4e00d-798e-4fbe-a6ca-2c5735ddf049>

### Areas of outstanding natural beauty

Published by Natural England this data set shows all protected and managed areas of natural beauty within the UK.

![image-20250610-125829.png](attachments/6c1daf2f-a606-46a9-903d-7435a04642e1.png)

The following attributes are available for interrogation:

![image-20250610-130431.png](attachments/b8f8bae8-632a-4751-ab0f-20ca3bfca8af.png)

This dataset can be downloaded directly to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system, a copy is also stored in the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

### Sites of Special Scientific Interest

This data set shows any Site of Special Scientific Interest (SSSI) this is the land notified as an SSSI under the Wildlife and Countryside Act (1981).

![image-20250610-130913.png](attachments/48e677a3-fd5f-4337-95c1-db0baff1a06b.png)

The following attributes are available for interrogation:

![image-20250610-131021.png](attachments/bd780fc1-6fc1-40e9-bdab-96b3f6ed8b1b.png)

This dataset can be downloaded directly to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system, a copy is also stored in the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

### Special Areas of Conservation

This resource contains the spatial dataset of Special Areas of Conservation in Great Britain (excluding offshore areas), and is available as a GeoJSON Download.

![image-20250610-132006.png](attachments/2c9c672b-12c6-4f31-ba80-fcb9131bc279.png)

The following attributes are available for interrogation:

![image-20250610-131701.png](attachments/2b6e8893-23ca-4182-bda6-d174bb874812.png)

This dataset can be downloaded directly to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system, a copy is also stored in the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.

### Protected Areas Layer

A composite layer showing all 3 protected areas has been created by merging in QGIS:

- Areas of outstanding natural beauty
- Sites of Special Scientific Interest
- Special Areas of Conservation

![image-20250610-144052.png](attachments/4a791a05-56ae-475c-8e76-39bedf06880e.png)

The output generates the following:

![image-20250610-144422.png](attachments/dd6d85ad-75b2-454c-9862-cd64f669c648.png)

This layer maintains all the attributes of the input layers:

![image-20250610-144614.png](attachments/29645cbc-1842-46a9-9ac2-a93aacae615a.png)

This dataset is exported to GeoJSON using the EPSG:27700 - OSGB36 / British National Grid co-ordinate reference system, a copy is also stored in the AWS S3 bucket **537124944113-nova-datascience** in the sub folder GeoJSON.
