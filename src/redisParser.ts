export const getValue = (key: string, data: any[]) => {
  const index = data.findIndex((v) => v === key)
  if (index < 0) return null
  return data[index + 1]
}

export const getEntry = (data: string[][] | null) => {
  if (!data) return null
  return {
    id: data[0],
    operationId: getValue('operationId', data[1]),
    eventId: getValue('eventId', data[1]),
    data: JSON.parse(getValue('data', data[1])),
  }
}
