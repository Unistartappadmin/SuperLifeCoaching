import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    featuredImage: z.string().optional(),
    category: z.enum(['Mindset', 'Career', 'Relationships', 'Personal Growth', 'Leadership']).default('Personal Growth'),
    readTime: z.string().default('5 min read'),
    author: z.string().default('SuperLife Coaching'),
  }),
});

export const collections = { blog };
