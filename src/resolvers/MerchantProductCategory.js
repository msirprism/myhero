function merchant(parent, args, context) {
  return context.prisma.merchantProductCategory.findOne({where: {id: parent.id}}).merchant_merchantTomerchantProductCategory()
}

function productCategories(parent, args, context){
  return context.prisma.merchantProductCategory.findOne({where: {id: parent.id}}).productCategories()	
}

module.exports = {
	merchant,
	productCategories,
}