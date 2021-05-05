function merchant(parent, args, context) {
  return context.prisma.merchantProductSize.findOne({where: {id: parent.id}}).merchant_merchantTomerchantProductSize()
}

function productSizes(parent, args, context){
  return context.prisma.merchantProductSize.findOne({where: {id: parent.id}}).productSize()	
}

module.exports = {
	merchant,
	productSizes,
}