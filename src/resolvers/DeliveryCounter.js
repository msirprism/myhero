function merchant(parent, args, context) {
    return context.prisma.deliveryCounter.findOne({where: {id: parent.id}}).merchant_deliverycounterTomerchant()
}

module.exports = {
    merchant,
}