FROM python:3-onbuild

COPY ./pgoapi /pgoapi
COPY ./backend.py /backend.py

RUN for r in `cat requirements.txt`; do pip install $r; done

ENTRYPOINT [ "python", "-u", "/backend.py" ]
