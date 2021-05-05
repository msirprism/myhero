function hero(parent, args, context) {
    return context.prisma.paidCollectible.findOne({where: {id: parent.id}}).hero_heroTopaidCollectible()
}

module.exports = {
    hero
}