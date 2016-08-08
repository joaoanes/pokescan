FROM python:2.7-onbuild

COPY ./pgoapi /pgoapi
COPY ./backend.py /backend.py
COPY ./libencrypt /libencrypt

RUN apt-get install -y -qq make gcc
RUN for r in `cat requirements.txt`; do pip install $r; done
RUN make -C libencrypt
RUN mv ./libencrypt/libencrypt.so .

ENTRYPOINT [ "python", "-u", "/backend.py" ]
