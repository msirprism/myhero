function category(parent, args, context) {
    return context.prisma.merchantCategory.findOne({where: {id: parent.id}}).category_categoryTomerchantCategory()
}
  
function merchant(parent, args, context) {
    return context.prisma.merchantCategory.findOne({where: {id: parent.id}}).merchant_merchantTomerchantCategory()
}

module.exports = {
    category,
    merchant
}