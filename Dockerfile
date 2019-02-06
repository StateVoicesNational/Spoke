FROM node:6.10

# Install Spoke
ARG SPOKE_VERSION=1.4.1
ENV OUTPUT_DIR=/Spoke/build \
    SPOKE_VERSION=$SPOKE_VERSION \
    SUDO_USER=root
RUN wget https://github.com/MoveOnOrg/Spoke/archive/v$SPOKE_VERSION.tar.gz && \
    tar zxf v$SPOKE_VERSION.tar.gz && \
    rm v$SPOKE_VERSION.tar.gz && \
    mv /Spoke-$SPOKE_VERSION /Spoke && \
    cd /Spoke && \
    npm install && \
    npm install -g foreman

# Spoke Runtime
WORKDIR /Spoke
EXPOSE 3000
CMD ["nf", "start", "--procfile", "./dev-tools/Procfile.dev"]
