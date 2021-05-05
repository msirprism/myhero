function merchant(parent, args, context) {
  return context.prisma.productCategory.findOne({where: {id: parent.id}}).merchant_merchantToproductCategory()
}

function product(parent, args, context) {
  return context.prisma.productCategory.findOne({where: {id: parent.id}}).product_productToproductCategory()
}

function merchantProductCategory(parent, args, context, info){
  return context.prisma.productCategory.findOne({where: {id: parent.id}}).merchantProductCategory_merchantProductCategoryToproductCategory()	
}

module.exports = {
	merchant,
	product,
	merchantProductCategory,
}