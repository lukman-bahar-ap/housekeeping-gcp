# housekeeping-gcp

prepare your own .env, bellow is sample if you split project per code  :

appenginee env : 
```  
PROJECT_ID
APP_SERVICE_NAME
```

artifact registry env : 
```
PROJECT_ID
LOCATION
REPOSITORY
```

cloud run env : 
```
PROJECT_ID
REGION
CLOUD_RUN_SERVICE_NAME
```

for mantainable many infra, better update the code to use request GET / POST, to get variable like PROJECT_ID, APP_SERVICE_NAME, LOCATION, REPOSITORY etc...

this code deployed on cloud run function, use scheduler for trigger