from __future__ import division
"""
pgoapi - Pokemon Go API
Copyright (c) 2016 tjado <https://github.com/tejado>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.

Author: tjado <https://github.com/tejado>
"""

import os
import re
import sys
import json
import time
import struct
import redis
import pprint
import random
import logging
import requests
import argparse
import getpass

# add directory of this file to PATH, so that the package will be found
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

# import Pokemon Go API lib
from pgoapi import pgoapi
from pgoapi import utilities as util

from pymongo import MongoClient, GEOSPHERE

# other stuff
from google.protobuf.internal import encoder
from geopy.geocoders import GoogleV3
from s2sphere import Cell, CellId, LatLng


def get_pos_by_name(location_name):
    geolocator = GoogleV3()
    loc = geolocator.geocode(location_name, timeout=10)

    return (loc.latitude, loc.longitude, loc.altitude)

def get_cell_ids(lat, long, radius = 10):
    origin = CellId.from_lat_lng(LatLng.from_degrees(lat, long)).parent(15)
    walk = [origin.id()]
    right = origin.next()
    left = origin.prev()

    # Search around provided radius
    for i in range(radius):
        walk.append(right.id())
        walk.append(left.id())
        right = right.next()
        left = left.prev()

    # Return everything
    return sorted(walk)

def encode(cellid):
    output = []
    encoder._VarintEncoder()(output.append, cellid)
    return ''.join(output)

def init_config():
    parser = argparse.ArgumentParser()
    config_file = "config.json"

    # If config file exists, load variables from json
    load   = {}
    if os.path.isfile(config_file):
        with open(config_file) as data:
            load.update(json.load(data))

    # Read passed in Arguments
    required = lambda x: not x in load
    parser.add_argument("-a", "--auth_service", help="Auth Service ('ptc' or 'google')",
        required=required("auth_service"))
    parser.add_argument("-u", "--username", help="Username", required=required("username"))
    parser.add_argument("-p", "--password", help="Password")
    parser.add_argument("-l", "--location", help="Location", required=required("location"))
    parser.add_argument("-d", "--debug", help="Debug Mode", action='store_true')
    parser.add_argument("-t", "--test", help="Only parse the specified location", action='store_true')
    parser.set_defaults(DEBUG=False, TEST=False)
    config = parser.parse_args()

    # Passed in arguments shoud trump
    for key in config.__dict__:
        if key in load and config.__dict__[key] == None:
            config.__dict__[key] = str(load[key])

    if config.__dict__["password"] is None:
        config.__dict__["password"] = getpass.getpass()

    if config.auth_service not in ['ptc', 'google']:
      return None

    return config


def main():

    config = init_config()
    if not config:
        return

    if config.debug:
        logging.getLogger("requests").setLevel(logging.DEBUG)
        logging.getLogger("pgoapi").setLevel(logging.DEBUG)
        logging.getLogger("rpc_api").setLevel(logging.DEBUG)

    position = get_pos_by_name(config.location)
    if config.test:
        return
    uri = "mongodb://" + str(os.environ['MONGO_PORT_27017_TCP_ADDR'])
    mongoClient = MongoClient( uri )
    db = mongoClient.pokemon
    db.pokemon.create_index([("location", GEOSPHERE)])

    # instantiate pgoapi
    api = pgoapi.PGoApi()

    api.set_position(*position)

    if not api.login(config.auth_service, config.username, config.password):
        return

    poi = find_poi(api, position[0], position[1], db)

def find_poi(api, lat, lng, db):
    poi = {'pokemons': {}, 'forts': []}
    step_size = 0.0015
    step_limit = 49
    coords = generate_spiral(lat, lng, step_size, step_limit)
    for coord in coords:

        lat = coord['lat']
        lng = coord['lng']
        api.set_position(lat, lng, 0)
        print( format(((coords.index(coord) + 1) / len(coords) * 100), ".2f") + " complete, at " + str(lat) + " " + str(lng) )

        cell_ids = get_cell_ids(lat, lng)
        timestamps = [0,] * len(cell_ids)
        api.get_map_objects(latitude = util.f2i(lat), longitude = util.f2i(lng), since_timestamp_ms = timestamps, cell_id = cell_ids)
        response_dict = api.call()
        if 'status' in response_dict['responses']['GET_MAP_OBJECTS']:
            if response_dict['responses']['GET_MAP_OBJECTS']['status'] == 1:
                    for map_cell in response_dict['responses']['GET_MAP_OBJECTS']['map_cells']:
                        if 'wild_pokemons' in map_cell:
                            for pokemon in map_cell['wild_pokemons']:
                                pokekey = get_key_from_pokemon(pokemon)
                                pokemon['hides_at'] = time.time() + pokemon['time_till_hidden_ms']/1000
                                pokemon['location'] =   {'type': 'Point', 'coordinates': [float(pokemon['latitude']), float(pokemon['longitude'])]}
                                pokemon['pokekey'] = pokekey
                                del pokemon["last_modified_timestamp_ms"]
                                del pokemon["longitude"]
                                del pokemon["latitude"]
                                del pokemon["encounter_id"]
                                del pokemon["time_till_hidden_ms"]

                                if db.pokemon.find({"pokekey": pokekey}, {"_id": 1}).limit(1).count() == 0:
                                    db.pokemon.insert(pokemon)
                                    poi['pokemons'][pokekey] = pokemon


    print(poi)
    return poi


def get_key_from_pokemon(pokemon):
    return '{}-{}-{}'.format(pokemon['spawnpoint_id'], pokemon['pokemon_data']['pokemon_id'], hex(int(time.time() + pokemon['time_till_hidden_ms']/1000)))


def generate_spiral(starting_lat, starting_lng, step_size, step_limit):
    coords = [{'lat': starting_lat, 'lng': starting_lng}]
    steps,x,y,d,m = 1, 0, 0, 1, 1
    rlow = 0.0
    rhigh = 0.0005

    while steps < step_limit:
        while 2 * x * d < m and steps < step_limit:
            x = x + d
            steps += 1
            lat = x * step_size + starting_lat + random.uniform(rlow, rhigh)
            lng = y * step_size + starting_lng + random.uniform(rlow, rhigh)
            coords.append({'lat': lat, 'lng': lng})
        while 2 * y * d < m and steps < step_limit:
            y = y + d
            steps += 1
            lat = x * step_size + starting_lat + random.uniform(rlow, rhigh)
            lng = y * step_size + starting_lng + random.uniform(rlow, rhigh)
            coords.append({'lat': lat, 'lng': lng})

        d = -1 * d
        m = m + 1
    return coords


if __name__ == '__main__':
    main()
