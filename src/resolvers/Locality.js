function merchantLocalities(parent, args, context) {
  return context.prisma.category
    .findOne({ where: { id: parent.id } })
    .merchantLocality();
}

module.exports = {
  merchantLocalities,
};
