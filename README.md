[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=digitelts_dlt-adapter)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=bugs)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=coverage)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

# Introduction
The DLT Adapter, also referred to as the DLT Interface is a component used by the Blockchain Connector to interact with the Blockchain technology in a transparent way. It is provided as a REST API. **Keep in mind that this is a WIP and it is not production-ready yet**. 

It is built using TypeScript 4.7.4 with express 4.17.3. It interacts with the blockchain through the smart contracts provided in https://github.com/alastria/DOME-blockchain_smart_contracts/tree/main.

## Main features:
- Blockchain node selection for all the Blockchain interaction.
- DOME Events publishing.
- DOME Events subscription.
- Retrieval of active DOME Events between dates.


# Getting Started

## Prerequisites
- [Node 14.20.0](https://nodejs.org/en/blog/release/v14.20.0)
- [Docker Desktop](https://www.docker.com/)
- [Git](https://git-scm.com/)
- The aforementioned smart contracts deployed on the EVM network to be used.

## Application profiles
- <b>DEBUG</b>: this profile can be setted via the DEBUG environment variable. Setting this variable to "*" enables extensive logging to the API.

## OpenAPI specification
You can see the OpenAPI specification at `/docs`

## Tweaking the component to connect to an EVM blockchain
To configure the component to connect to a certain EVM blockchain you need to:
- Deploy the smart contract at `https://github.com/alastria/DOME-blockchain_smart_contracts/tree/main` in your blockchain network. 
- Change the contract address and ABI env variables as defined in `.env` file to fit the one deployed in your network. 
- Change the block number from which all events will be considered legit events i.e. not test events although written by trusted entities of DOME, not events written in earyly development phases.

## "Bare metal" installation
- Clone the DLT Adapter project `git clone git@github.com:alastria/DOME-blockchain_connector-dlt_interface.git`
- Put the rpc address of the evm blokchain node to be used by default in the `.env` file.
- Put the iss identifier of the legal entity in which name events are going to be published (it can and will be your legal entity in most cases) in the `.env` file. This is the hash of your Organization Identifier as established by eIDAS regulation.
- Put the private key of the Ethereum account that is going to be publishing the events through the blockchain node in the `.env` file.
- Put the DOME Events contract address of your EVM compatible blockchain in the `.env` file.
- Put the DOME Events contract ABI of the contract deployed in your EVM compatible blockchain in the `.env` file.
- Put the DOME Production block number of the EVM network from which events will be considered as legit in the `.env` file.
- Create the Docker image of the component by using the Dockerfile at the root directory of the project.
- Execute the image in a docker container.
- The REST API will be available at `http://localhost:8080/`

## Installation using the Docker image
- Get the docker image from `https://quay.io/repository/digitelts/dlt-adapter`
- Run the docker image in a container indicating the `.env` file after setting all the env variables in the `.env` file as commented before.
- The REST API will be available at `http://localhost:8080/`

## Installation using the Helm Chart
- Add Alastria Helm Chart repository at `https://github.com/alastria/helm-charts` as a Helm repository
- Set all the env variables in the helm chart `values.yml` file.
- Install the Helm Chart with `helm install dlt-adapter dlt-adapter --values dlt-adapter/values.yml`
- The REST API will be available at `http://localhost:8080/`

# License
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)


# Acknowledgments
Thanks to DOME project teams, [Alastria](https://alastria.io/), and [IN2](https://digitelts.es/) for their contributions to our project and their expertise at a proceedings and technical level. We are honored to have work with such professional and king partners, and we look forward to future collaborations together.

# Authors
- [DigitelTS](https://digitelts.com/), [Alejandro Nieto](mailto:alejandro.nieto@madisonmk.com)
- [DigitelTS](https://digitelts.com/), [Alejandro Alfonso](mailto:alejandro.alfonso@madisonmk.com)
- [DigitelTS](https://digitelts.com/), [Victor Quiroga](mailto:victorjavier.quirog@madisonmk.com)

# Document Version
- v0.0.1