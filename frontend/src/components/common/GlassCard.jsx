import { Card } from '@mantine/core';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className, hover, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02 } : undefined}
    >
      <Card
        {...props}
        className={className}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: hover ? 'box-shadow 0.3s ease' : undefined,
          ...props.style,
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default GlassCard;
