function merchant(parent, args, context) {
    return context.prisma.paidPayable.findOne({where: {id: parent.id}}).merchant_merchantTopaidPayable()
}

module.exports = {
    merchant
}