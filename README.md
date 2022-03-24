# event-driven

'event-driven' library aims to simplify building backends in an event driven style(event driven architecture).
For message broker, light weight [Redis Stream](https://redis.io/topics/streams-intro) is used and for event store, the well known NoSQL database, MongoDB, is used. Note that event store stores all commands, events, their errors, and also some other analytical data used for monitoring. The errors stored in the event store is also used as a dead letter queue(DLQ), which is a crucial feature when implementing event driven architecture.

## Included features

- Store command(operation) events\
  A command(ex. GraphQL Mutation, POST request) initiates the "event flow(chain)"
- Publish & Subscribe with at least once delivery
- Horizontal scaling for subscription(fan out by using consumer groups)
- Retry Logic with acknowledgement\
  If the consumer does not acknowledge within a configured duration, the message borker pushes the event again to the consumer
  ```
  // terminal
  Event! - [User-nameUpdated]
  Event! - [Blog-userUpdated]
  Failed 1 times, clientGroup: Comment, errMsg: Test Error!! eventId:622303733628c902f133004b
  Failed 2 times, clientGroup: Comment, errMsg: Test Error!! eventId:622303733628c902f133004b
  Failed 3 times, clientGroup: Comment, errMsg: Test Error!! eventId:622303733628c902f133004b
  Failed 4 times, clientGroup: Comment, errMsg: Test Error!! eventId:622303733628c902f133004b
  Failed 5 times, clientGroup: Comment, errMsg: Test Error!! eventId:622303733628c902f133004b
  Error added to dead letter queue
  ```
- Dead Letter Queue(DLQ)\
  If the consumer fails to acknowledge the event for more than 5 times, it is removed(acknowledged) from the event stream and stored in DLQ.
- Event Management
  - list of events of all subjects
  - full event chain visualization for each command
    ![event-chain](https://github.com/hoffnung8493/event-driven-modular-monolith/blob/master/readme-assets/event-chain.png?raw=true)
  - Check error message and retry failed consumption from DLQ
    ![dead-letter-queue](https://github.com/hoffnung8493/event-driven-modular-monolith/blob/master/readme-assets/dead-letter-queue.png?raw=true)

# How to get started

Detailed documents will come soon.
For now here is a full [boilerplate](https://github.com/hoffnung8493/event-driven-modular-monolith) that uses the 'event-driven' library to build a very simple backend for a blog service.

# Roadmap

- Library documentation
- Slack Webhook when DLQ receives new errors
- Duplicate the event data($out) to a cheap file storage, AWS S3
- Apply TTL to event data in event store(mongodb), to keep the storage size in a reasonable size.
- Able to replay/query "all" events. Use MongoDB Data Lake to replay/query from "all" events
- Dashboard - full event chain visualization summary for each "subject"
- Event Version Control
  - Each event should store a version number
  - When version is upgraded, provide a function that updates old event data to the newest version
- Able to smoothly split a single module into multiple modules
- Able to OperationInit to none request initiation, such as external event subscription/webhook etc.

# Why Redis for event broker?

Other considered event brokers are Kafka, RabbitMQ Stream, NATS JetStream.
All of them meet the requirement as a event broker for building event driven architecture.
But only Redis Stream meets all of the following criteria.

- Light weight
- Easy to setup
- Amazing docs
- Familiarity. Redis is usually an already used component in most backends
- Managed services available with free plan

# Why MongoDB for event store?

- Easy to setup
- Amazing docs
- Reach MongoDB Query Language(MQL) that can be used to query unstructured event data
- With MongoDB Data Lake event data can easily be stored to and queried from cheap file storage, such as AWS S3
- Faimilarity. MongoDB Is the most popular NoSQL database
- Managed services available with free plan
