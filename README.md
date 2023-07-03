# Titleify

NestJs application to generate the title of the text.

## Description

Titleify is a NestJs application that utilizes various technologies to generate titles for given texts. It integrates with MongoDB for data storage, Kafka as a message broker for asynchronous processing, and the OpenAI API for title generation.

## Features

- Generate titles for given texts
- Store titles and related information in MongoDB
- Asynchronous title generation using Kafka
- Integration with the OpenAI API for title generation

## Technologies Used

- Node.js
- NestJs
- Docker
- Kafka
- OpenAI
- MongoDB

## Usage
Refer .sample.env to add the relevant environment variables before running application via docker

```bash
docker-compose build
docker-compose up
```

## API Documentation

### Generate Title
Endpoint: `POST /title-generation`

Request Body:
```
{
  "text": "sample text"
}
```

Response:

```
{
  "requestId": "asd",
  "status": "QUEUED"
}
```

### Get Title by ID
Endpoint: `GET /title-generation/:id`

Response:

```
{
  "requestId": "id",
  "status": "COMPLETED",
  "title": 'sample title
}
```

OR

```
{
  "requestId": "id",
  "status": "QUEUED",
}
```

## Testing

### Unit test
```
npm run test
```

### E2E test
```
npm run test:e2e
```

## Asynchronous Title Generation with Kafka

Titleify utilizes Kafka as a message broker for asynchronous processing of title generation requests. The implementation involves the following steps:

1. When a new title generation request is made through the API, the request is published to the `create_title` topic in Kafka. This topic acts as a message queue.

2. The title generation service, which is a Kafka consumer, listens to the `create_title` topic. It consumes the messages from the topic and asynchronously generates the title using the OpenAI API.

3. After generating the title, the service updates the database with the generated title and sets the status to `COMPLETED`. This allows easy retrieval of titles and their associated information.

4. In case the application encounters an error during title generation, it publishes an error message to the `error` topic in Kafka. The error message contains relevant information about the error for further analysis.

5. When an error message is consumed from the `error` topic, the database is updated with the corresponding request ID, and the status is set to `ERROR`. This helps in tracking and managing failed title generation requests.

By leveraging Kafka's messaging capabilities, Titleify ensures reliable and scalable title generation. The decoupled architecture enables asynchronous processing, fault tolerance, and easy integration with other components.
