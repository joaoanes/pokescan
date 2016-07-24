#!/bin/bash

docker run -d -p 27017:27017 -v /opt/mongodb/:/data/db --name pokeMongo mongo:latest
