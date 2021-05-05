function merchantTags(parent, args, context) {
    return context.prisma.tag.findOne({where: {id: parent.id}}).merchantTag()
}

module.exports = {
    merchantTags
}