function merchantCategories(parent, args, context) {
  return context.prisma.category
    .findOne({ where: { id: parent.id } })
    .merchantCategory();
}

module.exports = {
  merchantCategories,
};
