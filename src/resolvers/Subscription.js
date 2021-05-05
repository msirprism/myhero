function newTagSubscribe(parent, args, context, info) {
    return context.pubsub.asyncIterator("NEW_TAG")
}

function updatedOrderSubscribe(parent, args, context, info) {
    return context.pubsub.asyncIterator("UPDATED_ORDER")
}

const newTag = {
    subscribe: newTagSubscribe,
    resolve: payload => {
        return payload
    },
}

const updatedOrder = {
    subscribe: updatedOrderSubscribe,
    resolve: payload => {
        return payload
    },
}

module.exports = {
    newTag,
    updatedOrder
}