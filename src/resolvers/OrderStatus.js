function orders(parent, args, context) {
    return context.prisma.orderStatus.findOne({where: {id: parent.id}}).order()
}
  
module.exports = {
    orders
}