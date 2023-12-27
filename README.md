[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=digitelts_dlt-adapter)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=bugs)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=digitelts_dlt-adapter&metric=coverage)](https://sonarcloud.io/summary/new_code?id=digitelts_dlt-adapter)

# Introduction
The DLT Adapter, also referred to as the DLT Interface is a component used by the Blockchain Connector to interact with the Blockchain technology in a transparent way. It is provided as a REST API.

It is built using TypeScript 4.7.4 with express 4.17.3. **Keep in mind that this is a WIP and it is not production-ready yet**.

## Main features:
- Blockchain node selection for all the Blockchain interaction.
- DOME Events publishing.
- DOME Events subscription.


# Getting Started

## Prerequisites
- [Node 14.20.0](https://nodejs.org/en/blog/release/v14.20.0)
- [Docker Desktop](https://www.docker.com/)
- [Git](https://git-scm.com/)

## Application profiles
- <b>DEBUG</b>: this profile can be setted via the DEBUG environment variable. Setting this variable to "*" enables extensive logging to the API.

### OpenAPI specification
You can see the OpenAPI specification at `/docs`

## Installing
- Clone the DLT Adapter project `git clone git@github.com:alastria/DOME-blockchain_connector-dlt_interface.git`
- Put the private key of the Ethereum account that is going to be publishing the events through the blockchain node in the `.env` file.
- Put the secret to be used to generated the cookies in the `.env` file.
- Create the Docker image of the component by using the Dockerfile at the root directory of the project.
- Execute the image in a docker container.
- The REST API will be available at http://localhost:8080/

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