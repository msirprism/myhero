function product(parent, args, context) {
  return context.prisma.productSize.findOne({where: {id: parent.id}}).product_productToproductSize();
}

function merchantProductSize(parent, args, context, info){
  return context.prisma.productSize.findOne({where: {id: parent.id}}).merchantProductSize_merchantProductSizeToproductSize()	
}

module.exports = {
  product,
  merchantProductSize,
}
