import React, { useMemo, useContext } from 'react'
import { Paper, Toolbar, Typography, Box } from '@mui/material'
import moment from 'moment'
import { OperationDoc, EventDoc, EventErrorDoc, OperationErrorDoc } from '../../../../../src/backend/models'
import Tree from 'react-d3-tree'
import { MessageDataContext } from '../context/MessageData'

const EventChain: React.FC<{
  operation: OperationDoc
  operationError?: OperationErrorDoc
  events: EventDoc[]
  eventErrors: EventErrorDoc[]
}> = (data) => {
  const { setMessageData } = useContext(MessageDataContext)
  const eventTree = useMemo(() => {
    interface TreeNode {
      name: string
      attributes: any
      children: TreeNode[]
    }

    const formatDate = (date: Date) => moment(date).format('MM/DD HH:mm:ss')

    const getChildren = (parentId: string, events: EventDoc[], errors: EventErrorDoc[]): TreeNode[] => [
      ...events
        .filter((m) => m.parentId.toString() === parentId)
        .map((m) => ({
          name: `[EVENT]${m.subject}`,
          attributes: {
            id: m._id,
            clientGroup: m.clientGroup,
            republishCount: m.republish.length,
            receivedAt: formatDate(m.receivedAt),
            publishedAt: formatDate(m.publishedAt),
          },
          children: getChildren(m._id, events, errors),
        })),
      ...errors
        .filter((e) => e.parentId.toString() === parentId)
        .map((e) => ({
          name: `[ERROR]${e.publishingSubject}`,
          attributes: {
            id: e._id,
            clientGroup: e.clientGroup,
            errorCount: e.errorCount,
            errorMessage: e.error[0].message,
            createdAt: formatDate(e.createdAt),
          },
          children: [],
        })),
    ]

    return {
      name: `[COMMAND]${data.operation.name ?? '_NO_OPERATION_NAME'}`,
      attributes: {
        id: data.operation._id,
        ...data.operation.variables,
        createdAt: formatDate(data.operation.createdAt),
      },
      children: getChildren(data.operation._id, data.events, data.eventErrors),
    }
  }, [data])
  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Full Event Chain
        </Typography>
      </Toolbar>
      <Box style={{ height: 'calc(100% - 70px)' }}>
        <Tree
          data={eventTree}
          orientation="vertical"
          translate={{ x: 300, y: 100 }}
          separation={{ siblings: 2 }}
          nodeSize={{ x: 150, y: 150 }}
          rootNodeClassName="node__root"
          branchNodeClassName="node__branch"
          leafNodeClassName="node__leaf"
          collapsible={false}
          onNodeClick={(node) => {
            const event = data?.events.find((v) => v._id === node.data.attributes?.id)
            if (event) return setMessageData(event)
            const msgError = data?.eventErrors.find((v) => v._id.toString() === node.data.attributes?.id)
            if (msgError) return setMessageData(msgError)
            setMessageData(data?.operation)
          }}
        />
      </Box>
    </Paper>
  )
}

export default EventChain
