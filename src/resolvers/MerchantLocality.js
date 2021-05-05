function merchant(parent, args, context) {
    return context.prisma.merchantLocality.findOne({where: {id: parent.id}}).merchant_merchantTomerchantLocality()
}

// function locality(parent, args, context) {
//     return context.prisma.merchantLocality.findOne({where: {id: parent.id}}).locality_localityTomerchantLocality()
// }

module.exports = {
    merchant,
    // locality
}