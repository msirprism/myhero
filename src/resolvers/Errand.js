function customer(parent, args, context) {
  return context.prisma.errand.findOne({where: {id: parent.id}}).user()
}

function hero(parent, args, context) {
  return context.prisma.errand.findOne({where: {id: parent.id}}).hero_errandTohero()
}


module.exports = {
  customer,
  hero,
}