import React from "react";
import styles from "./Products.module.css";

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

interface ProductsProps {
  className?: string;
  productCategories: ProductCategory[];
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
    <a href={href} className={styles.featureItem}>
      {cardContent}
    </a>
  ) : (
    <div className={styles.featureItem}>{cardContent}</div>
  );
};

const Products: React.FC<ProductsProps> = ({
  className = "",
  productCategories,
}) => {
  return (
    <section className={`${styles.products} ${className || ""}`}>
      <div className={styles.productsContainer}>
        <h2 className={styles.productsTitle}>Products</h2>

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
                      <a href={category.href}>{category.title}</a>
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
