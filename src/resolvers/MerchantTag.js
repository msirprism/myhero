function tag(parent, args, context) {
    return context.prisma.merchantTag.findOne({where: {id: parent.id}}).tag_merchantTagTotag()
}
  
function merchant(parent, args, context) {
    return context.prisma.merchantTag.findOne({where: {id: parent.id}}).merchant_merchantTomerchantTag()
}

module.exports = {
    tag,
    merchant
}