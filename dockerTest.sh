#!/bin/bash
docker run -e PGOAPIRUNNER_DEBUG='1' -i --link pokeMongo:mongo pgoapi-runner -l 41.1579 -L -8.6291 -u franjascenas5 -p password -a ptc
