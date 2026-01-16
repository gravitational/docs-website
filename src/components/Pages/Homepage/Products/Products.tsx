import React from "react";
import styles from "./Products.module.css";
import Link from "@docusaurus/Link";
import Icon, { IconName } from "@site/src/components/Icon";

interface ProductFeature {
  title: string;
  description: string;
  href?: string;
}

interface ProductCategory {
  id: string;
  title: string;
  href?: string;
  description: string;
  iconColor?: string;
  iconComponent: any;
  features: ProductFeature[];
}

interface HighlightedProduct {
  title: string;
  description: string;
  href?: string;
  image: any;
  tag?: {
    label: string;
    colorHex: string;
    icon?: IconName;
  };
}

interface ProductsProps {
  className?: string;
  productCategories: ProductCategory[];
  highlightedProduct?: HighlightedProduct;
}

const ProductCard: React.FC<ProductFeature> = ({
  title,
  description,
  href,
}) => {
  const cardContent = (
    <>
      <h4 className={styles.featureTitle}>{title}</h4>
      <p className={styles.featureDescription}>{description}</p>
    </>
  );

  return href ? (
    <Link to={href} className={styles.featureItem}>
      {cardContent}
    </Link>
  ) : (
    <div className={styles.featureItem}>{cardContent}</div>
  );
};

const Products: React.FC<ProductsProps> = ({
  className = "",
  productCategories,
  highlightedProduct,
}) => {
  return (
    <section className={`${styles.products} ${className || ""}`}>
      <div className={styles.productsContainer}>
        <h2 className={styles.productsTitle}>Teleport Products</h2>
        {highlightedProduct && (
          <div className={styles.highlightedProduct}>
            <div>
              {highlightedProduct.tag && (
                <div
                  className={styles.highlightedProductTag}
                  style={
                    {
                      backgroundColor: `${highlightedProduct.tag.colorHex}1a`,
                      borderColor: `${highlightedProduct.tag.colorHex}40`,
                      color: highlightedProduct.tag.colorHex,
                      "--highlighted-tag-color":
                        highlightedProduct.tag.colorHex || "#512fc9",
                    } as React.CSSProperties
                  }
                >
                  {highlightedProduct.tag.icon && (
                    <Icon
                      name={highlightedProduct.tag.icon}
                      className={styles.tagIcon}
                      size="sm"
                    />
                  )}
                  {highlightedProduct.tag.label}
                </div>
              )}
              <div className={styles.highlightedProductTitle}>
                {highlightedProduct.title}
              </div>
              <div className={styles.highlightedProductDescription}>
                {highlightedProduct.description}
              </div>
              {highlightedProduct.href && (
                <Link
                  to={highlightedProduct.href}
                  className={styles.highlightedProductLink}
                >
                  Read more
                </Link>
              )}
            </div>
            <div className={styles.highlightedProductImage}>
              {highlightedProduct.image && (
                <img
                  className={styles.image}
                  src={highlightedProduct.image}
                  alt={highlightedProduct.title}
                  width={400}
                  height={225}
                />
              )}
            </div>
          </div>
        )}
        {productCategories.map((category) => (
          <div key={category.id} className={styles.productCategory}>
            <div className={styles.categoryHeaderFlex}>
              <div
                className={styles.categoryIcon}
                style={{ backgroundColor: category.iconColor }}
              >
                <category.iconComponent className={styles.iconSvg} />
              </div>

              <div className={styles.categoryContent}>
                <div className={styles.categoryHeader}>
                  <h3 className={styles.categoryTitle}>
                    {category.href ? (
                      <Link to={category.href}>{category.title}</Link>
                    ) : (
                      category.title
                    )}
                  </h3>
                  <p className={styles.categoryDescription}>
                    {category.description}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.featuresGrid}>
              {category.features.map((feature, index) => (
                <ProductCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  href={feature.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Products;
