#!/bin/bash
docker run -i --link pokeMongo:mongo pgoapi-runner -l 0 -L 0 -u pokeradarpt -p fsociety -a google
