FROM ubuntu:22.04

RUN apt-get update -qq && apt-get install -y -qq lz4 ca-certificates socat expect && rm -rf /var/lib/apt/lists/*

# Install weave from local binary (pre-downloaded)
COPY weave.tar.gz /tmp/weave.tar.gz
RUN tar -xzf /tmp/weave.tar.gz -C /usr/local/bin/ && chmod +x /usr/local/bin/weave && rm /tmp/weave.tar.gz

WORKDIR /app

COPY rollup-config.json ./
COPY entrypoint.sh ./
COPY autolaunch.expect ./
RUN chmod +x /app/entrypoint.sh /app/autolaunch.expect

# Expose rollup ports
EXPOSE 26656 26657 1317 9090

CMD ["/app/entrypoint.sh"]
