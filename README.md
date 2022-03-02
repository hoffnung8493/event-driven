# event-driven

'event-driven' library aims to simplify building backends in event driven architecture.
For message broker, light weight [Redis Stream](https://redis.io/topics/streams-intro) is used and for event store, the well known NoSQL database, MongoDB is used.
Note that event store stores all events and also errors, which is used as a dead letter queue(DLQ)

'event-driven' includes the following must have features that are necessary to apply event driven architecture:

- Store command event
  A command(ex. GraphQL Mutation, POST request) initiates the "event flow(chain)"
- Publish & Subscribe
- Horizontal scaling for subscription(fan out by using consumer groups)
- Retry Logic with ACK(acknowledgement)
  If the consumer does not acknowledge within a configured duration, the message borker pushes the event again to the consumer
- Dead Letter Queue(DLQ)
  If the consumer fails to ACK the event for more than 5 times, it is removed(acknowledged) from the event stream and stored in DLQ.
- Event Dashboard
  - list of events of all subjects
  - full event chain visualization for each command
  - Error Logging
  - Retry failed consumption from DLQ

# Roadmap

- Duplicate the event data($out) to a cheap file storage, AWS S3
- Apply TTL to event data in event store(mongodb), to keep the storage size in a reasonable size.
- Able to replay/query "all" events. Use MongoDB Data Lake to replay/query from "all" events
- Dashboard - full event chain visualization summary for each "subject"
- Event Version Control
  - Each event should store a version number
  - When version is upgraded, provide a function that updates old event data to the newest version
- Support other message brokers, such as Kafka, RabbitMQ, NATS JetStream
- Support other event stores, such as MySQL, PostgreSQL

# Why Redis for message broker?

- Light weight
- Easy to setup
- Amazing docs
- Familiarity. Redis is usually an already used component in most backends
- Managed service with free plan

# Why MongoDB for event store?

- Easy to setup
- Amazing docs
- Reach MongoDB Query Language(MQL) that can be used to query unstructured event data
- Able to store and query event data from cheap file storage, such as AWS S3
- Faimilarity. MongoDB Is the most popular NoSQL database.
- Managed service with free plan
