function order(parent, args, context) {
  return context.prisma.transaksyon.findOne({where: {id: parent.id}}).order_orderTotransaksyon()
}

function status(parent, args, context) {
  return context.prisma.transaksyon.findOne({where: {id: parent.id}}).orderStatus_orderStatusTotransaksyon()
}

module.exports = {
  order,
  status
}