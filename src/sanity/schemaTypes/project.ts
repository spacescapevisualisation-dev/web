import { defineField, defineType } from "sanity";

export const projectType = defineType({
  name: "project",
  title: "Projects",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Project name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "Page URL", type: "slug", options: { source: "name", maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: "order", title: "Display order", type: "number", initialValue: 0, description: "Lower numbers appear first." }),
    defineField({ name: "location", title: "Location", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "year", title: "Year", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "architect", title: "Architect", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "developer", title: "Developer", type: "string" }),
    defineField({ name: "category", title: "Category label", type: "string", description: "Example: Supertall · Mixed-Use" }),
    defineField({ name: "typology", title: "Typology", type: "string", options: { list: ["Mixed-Use", "Cultural", "Residential", "Civic", "Commercial", "Hospitality"] }, validation: (rule) => rule.required() }),
    defineField({ name: "discipline", title: "Portfolio category", type: "string", initialValue: "Exterior", options: { list: ["Exterior", "Interior"] }, validation: (rule) => rule.required() }),
    defineField({ name: "status", title: "Status", type: "string", options: { list: ["Concept", "In Progress", "Completed"] } }),
    defineField({ name: "size", title: "Project size", type: "string", description: "Example: 21,000 m²" }),
    defineField({ name: "summary", title: "Short introduction", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({ name: "description", title: "Full description", type: "text", rows: 7, validation: (rule) => rule.required() }),
    defineField({ name: "mainImage", title: "Main image", type: "image", options: { hotspot: true }, fields: [{ name: "alt", title: "Alternative text", type: "string" }], validation: (rule) => rule.required() }),
    defineField({ name: "secondaryImage", title: "Secondary image", type: "image", options: { hotspot: true }, validation: (rule) => rule.required() }),
    defineField({ name: "tertiaryImage", title: "Third image", type: "image", options: { hotspot: true }, description: "Optional third image used in the expanded gallery and project page." }),
    defineField({ name: "quaternaryImage", title: "Fourth image", type: "image", options: { hotspot: true }, description: "Optional fourth image used in the expanded gallery and project page." }),
    defineField({ name: "additionalImages", title: "Additional gallery images", type: "array", of: [{ type: "image", options: { hotspot: true } }], description: "Optional extra images shown after the first four." }),
    defineField({ name: "featured", title: "Featured project", type: "boolean", initialValue: false }),
    defineField({ name: "span", title: "Homepage tile shape", type: "string", initialValue: "std", options: { list: [{ title: "Standard", value: "std" }, { title: "Wide", value: "wide" }, { title: "Tall", value: "tall" }] } }),
    defineField({ name: "align", title: "Gallery alignment", type: "string", initialValue: "left", options: { list: ["left", "right", "full"] } }),
  ],
  preview: {
    select: { title: "name", subtitle: "location", media: "mainImage" },
  },
});
