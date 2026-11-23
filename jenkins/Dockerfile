
# Get the Docker CLI from the official Docker CLI image
FROM docker:cli AS docker-cli

# Use the same Jenkins base image you already have
FROM jenkins/jenkins:lts-jdk21

USER root

# Copy only the Docker CLI, not a Docker daemon
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

RUN docker --version

USER jenkins
