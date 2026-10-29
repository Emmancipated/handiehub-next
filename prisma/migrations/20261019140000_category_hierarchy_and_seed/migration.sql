-- Category hierarchy (subcategories) + the initial marketplace taxonomy.
--
-- `parentId` is a nullable self-relation: top-level categories have `NULL`,
-- subcategories point at their parent. Seed rows use the slug as their id so
-- the inserts are deterministic and idempotent across environments (the build
-- runs `prisma migrate deploy`, so no separate seed step is required).

ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

ALTER TABLE "Category"
    ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- Top-level categories
INSERT INTO "Category" (id, slug, name, "parentId", "createdAt") VALUES
    ('home_kitchen', 'home_kitchen', 'Home & Kitchen', NULL, now()),
    ('electronics_technology', 'electronics_technology', 'Electronics & Technology', NULL, now()),
    ('fashion_beauty', 'fashion_beauty', 'Fashion & Beauty', NULL, now()),
    ('health_wellness', 'health_wellness', 'Health & Wellness', NULL, now()),
    ('automobiles', 'automobiles', 'Automobiles', NULL, now()),
    ('real_estate_property', 'real_estate_property', 'Real Estate & Property', NULL, now()),
    ('business_professional_services', 'business_professional_services', 'Business & Professional Services', NULL, now()),
    ('education_training', 'education_training', 'Education & Training', NULL, now()),
    ('events_entertainment', 'events_entertainment', 'Events & Entertainment', NULL, now()),
    ('agriculture_food', 'agriculture_food', 'Agriculture & Food', NULL, now()),
    ('construction_engineering', 'construction_engineering', 'Construction & Engineering', NULL, now()),
    ('freelance_digital_services', 'freelance_digital_services', 'Freelance & Digital Services', NULL, now()),
    ('travel_hospitality', 'travel_hospitality', 'Travel & Hospitality', NULL, now()),
    ('kids_babies', 'kids_babies', 'Kids & Babies', NULL, now()),
    ('other_services', 'other_services', 'Other Services', NULL, now())
ON CONFLICT (slug) DO NOTHING;

-- Subcategories
INSERT INTO "Category" (id, slug, name, "parentId", "createdAt") VALUES
    -- 1. Home & Kitchen
    ('home_kitchen_furniture', 'home_kitchen_furniture', 'Furniture', 'home_kitchen', now()),
    ('home_kitchen_home_decor', 'home_kitchen_home_decor', 'Home Decor', 'home_kitchen', now()),
    ('home_kitchen_kitchen_appliances', 'home_kitchen_kitchen_appliances', 'Kitchen Appliances', 'home_kitchen', now()),
    ('home_kitchen_cookware_utensils', 'home_kitchen_cookware_utensils', 'Cookware & Utensils', 'home_kitchen', now()),
    ('home_kitchen_bedding_bath', 'home_kitchen_bedding_bath', 'Bedding & Bath', 'home_kitchen', now()),
    ('home_kitchen_cleaning_supplies', 'home_kitchen_cleaning_supplies', 'Cleaning Supplies', 'home_kitchen', now()),
    ('home_kitchen_home_improvement', 'home_kitchen_home_improvement', 'Home Improvement', 'home_kitchen', now()),
    ('home_kitchen_interior_design_services', 'home_kitchen_interior_design_services', 'Interior Design Services', 'home_kitchen', now()),
    ('home_kitchen_home_cleaning_services', 'home_kitchen_home_cleaning_services', 'Home Cleaning Services', 'home_kitchen', now()),
    ('home_kitchen_moving_relocation_services', 'home_kitchen_moving_relocation_services', 'Moving & Relocation Services', 'home_kitchen', now()),
    -- 2. Electronics & Technology
    ('electronics_technology_smartphones', 'electronics_technology_smartphones', 'Smartphones', 'electronics_technology', now()),
    ('electronics_technology_computers_laptops', 'electronics_technology_computers_laptops', 'Computers & Laptops', 'electronics_technology', now()),
    ('electronics_technology_accessories', 'electronics_technology_accessories', 'Accessories', 'electronics_technology', now()),
    ('electronics_technology_smart_home_devices', 'electronics_technology_smart_home_devices', 'Smart Home Devices', 'electronics_technology', now()),
    ('electronics_technology_tv_audio_systems', 'electronics_technology_tv_audio_systems', 'TV & Audio Systems', 'electronics_technology', now()),
    ('electronics_technology_repair_services', 'electronics_technology_repair_services', 'Repair Services', 'electronics_technology', now()),
    ('electronics_technology_it_support_services', 'electronics_technology_it_support_services', 'IT Support Services', 'electronics_technology', now()),
    ('electronics_technology_software_development_services', 'electronics_technology_software_development_services', 'Software Development Services', 'electronics_technology', now()),
    -- 3. Fashion & Beauty
    ('fashion_beauty_mens_clothing', 'fashion_beauty_mens_clothing', 'Men''s Clothing', 'fashion_beauty', now()),
    ('fashion_beauty_womens_clothing', 'fashion_beauty_womens_clothing', 'Women''s Clothing', 'fashion_beauty', now()),
    ('fashion_beauty_kids_fashion', 'fashion_beauty_kids_fashion', 'Kids Fashion', 'fashion_beauty', now()),
    ('fashion_beauty_shoes', 'fashion_beauty_shoes', 'Shoes', 'fashion_beauty', now()),
    ('fashion_beauty_bags_accessories', 'fashion_beauty_bags_accessories', 'Bags & Accessories', 'fashion_beauty', now()),
    ('fashion_beauty_jewelry_watches', 'fashion_beauty_jewelry_watches', 'Jewelry & Watches', 'fashion_beauty', now()),
    ('fashion_beauty_makeup_cosmetics', 'fashion_beauty_makeup_cosmetics', 'Makeup & Cosmetics', 'fashion_beauty', now()),
    ('fashion_beauty_hair_beauty_services', 'fashion_beauty_hair_beauty_services', 'Hair & Beauty Services', 'fashion_beauty', now()),
    ('fashion_beauty_tailoring_fashion_design_services', 'fashion_beauty_tailoring_fashion_design_services', 'Tailoring & Fashion Design Services', 'fashion_beauty', now()),
    -- 4. Health & Wellness
    ('health_wellness_fitness_equipment', 'health_wellness_fitness_equipment', 'Fitness Equipment', 'health_wellness', now()),
    ('health_wellness_supplements_vitamins', 'health_wellness_supplements_vitamins', 'Supplements & Vitamins', 'health_wellness', now()),
    ('health_wellness_medical_supplies', 'health_wellness_medical_supplies', 'Medical Supplies', 'health_wellness', now()),
    ('health_wellness_personal_care_products', 'health_wellness_personal_care_products', 'Personal Care Products', 'health_wellness', now()),
    ('health_wellness_gym_fitness_training', 'health_wellness_gym_fitness_training', 'Gym & Fitness Training', 'health_wellness', now()),
    ('health_wellness_physiotherapy_services', 'health_wellness_physiotherapy_services', 'Physiotherapy Services', 'health_wellness', now()),
    ('health_wellness_home_healthcare_services', 'health_wellness_home_healthcare_services', 'Home Healthcare Services', 'health_wellness', now()),
    -- 5. Automobiles
    ('automobiles_cars_for_sale', 'automobiles_cars_for_sale', 'Cars for Sale', 'automobiles', now()),
    ('automobiles_motorcycles', 'automobiles_motorcycles', 'Motorcycles', 'automobiles', now()),
    ('automobiles_auto_parts_accessories', 'automobiles_auto_parts_accessories', 'Auto Parts & Accessories', 'automobiles', now()),
    ('automobiles_vehicle_rental', 'automobiles_vehicle_rental', 'Vehicle Rental', 'automobiles', now()),
    ('automobiles_mechanic_services', 'automobiles_mechanic_services', 'Mechanic Services', 'automobiles', now()),
    ('automobiles_car_wash_detailing', 'automobiles_car_wash_detailing', 'Car Wash & Detailing', 'automobiles', now()),
    ('automobiles_logistics_delivery_services', 'automobiles_logistics_delivery_services', 'Logistics & Delivery Services', 'automobiles', now()),
    -- 6. Real Estate & Property
    ('real_estate_property_houses_for_sale', 'real_estate_property_houses_for_sale', 'Houses for Sale', 'real_estate_property', now()),
    ('real_estate_property_houses_for_rent', 'real_estate_property_houses_for_rent', 'Houses for Rent', 'real_estate_property', now()),
    ('real_estate_property_land', 'real_estate_property_land', 'Land', 'real_estate_property', now()),
    ('real_estate_property_commercial_property', 'real_estate_property_commercial_property', 'Commercial Property', 'real_estate_property', now()),
    ('real_estate_property_property_management_services', 'real_estate_property_property_management_services', 'Property Management Services', 'real_estate_property', now()),
    ('real_estate_property_facility_maintenance_services', 'real_estate_property_facility_maintenance_services', 'Facility Maintenance Services', 'real_estate_property', now()),
    -- 7. Business & Professional Services
    ('business_professional_services_accounting_services', 'business_professional_services_accounting_services', 'Accounting Services', 'business_professional_services', now()),
    ('business_professional_services_legal_services', 'business_professional_services_legal_services', 'Legal Services', 'business_professional_services', now()),
    ('business_professional_services_marketing_advertising', 'business_professional_services_marketing_advertising', 'Marketing & Advertising', 'business_professional_services', now()),
    ('business_professional_services_business_consulting', 'business_professional_services_business_consulting', 'Business Consulting', 'business_professional_services', now()),
    ('business_professional_services_printing_branding', 'business_professional_services_printing_branding', 'Printing & Branding', 'business_professional_services', now()),
    ('business_professional_services_hr_recruitment_services', 'business_professional_services_hr_recruitment_services', 'HR & Recruitment Services', 'business_professional_services', now()),
    -- 8. Education & Training
    ('education_training_online_courses', 'education_training_online_courses', 'Online Courses', 'education_training', now()),
    ('education_training_private_tutors', 'education_training_private_tutors', 'Private Tutors', 'education_training', now()),
    ('education_training_skill_training', 'education_training_skill_training', 'Skill Training', 'education_training', now()),
    ('education_training_career_coaching', 'education_training_career_coaching', 'Career Coaching', 'education_training', now()),
    ('education_training_certification_programs', 'education_training_certification_programs', 'Certification Programs', 'education_training', now()),
    -- 9. Events & Entertainment
    ('events_entertainment_event_planning', 'events_entertainment_event_planning', 'Event Planning', 'events_entertainment', now()),
    ('events_entertainment_photography_videography', 'events_entertainment_photography_videography', 'Photography & Videography', 'events_entertainment', now()),
    ('events_entertainment_dj_music_services', 'events_entertainment_dj_music_services', 'DJ & Music Services', 'events_entertainment', now()),
    ('events_entertainment_decorations_rentals', 'events_entertainment_decorations_rentals', 'Decorations & Rentals', 'events_entertainment', now()),
    ('events_entertainment_catering_services', 'events_entertainment_catering_services', 'Catering Services', 'events_entertainment', now()),
    -- 10. Agriculture & Food
    ('agriculture_food_farm_produce', 'agriculture_food_farm_produce', 'Farm Produce', 'agriculture_food', now()),
    ('agriculture_food_livestock', 'agriculture_food_livestock', 'Livestock', 'agriculture_food', now()),
    ('agriculture_food_agricultural_equipment', 'agriculture_food_agricultural_equipment', 'Agricultural Equipment', 'agriculture_food', now()),
    ('agriculture_food_food_delivery', 'agriculture_food_food_delivery', 'Food Delivery', 'agriculture_food', now()),
    ('agriculture_food_catering_services', 'agriculture_food_catering_services', 'Catering Services', 'agriculture_food', now()),
    ('agriculture_food_farming_consultation', 'agriculture_food_farming_consultation', 'Farming Consultation', 'agriculture_food', now()),
    -- 11. Construction & Engineering
    ('construction_engineering_building_materials', 'construction_engineering_building_materials', 'Building Materials', 'construction_engineering', now()),
    ('construction_engineering_contractors', 'construction_engineering_contractors', 'Contractors', 'construction_engineering', now()),
    ('construction_engineering_architects_engineers', 'construction_engineering_architects_engineers', 'Architects & Engineers', 'construction_engineering', now()),
    ('construction_engineering_renovation_services', 'construction_engineering_renovation_services', 'Renovation Services', 'construction_engineering', now()),
    ('construction_engineering_electrical_plumbing_services', 'construction_engineering_electrical_plumbing_services', 'Electrical & Plumbing Services', 'construction_engineering', now()),
    -- 12. Freelance & Digital Services
    ('freelance_digital_services_graphic_design', 'freelance_digital_services_graphic_design', 'Graphic Design', 'freelance_digital_services', now()),
    ('freelance_digital_services_content_writing', 'freelance_digital_services_content_writing', 'Content Writing', 'freelance_digital_services', now()),
    ('freelance_digital_services_social_media_management', 'freelance_digital_services_social_media_management', 'Social Media Management', 'freelance_digital_services', now()),
    ('freelance_digital_services_web_development', 'freelance_digital_services_web_development', 'Web Development', 'freelance_digital_services', now()),
    ('freelance_digital_services_virtual_assistance', 'freelance_digital_services_virtual_assistance', 'Virtual Assistance', 'freelance_digital_services', now()),
    ('freelance_digital_services_translation_services', 'freelance_digital_services_translation_services', 'Translation Services', 'freelance_digital_services', now()),
    -- 13. Travel & Hospitality
    ('travel_hospitality_hotels_apartments', 'travel_hospitality_hotels_apartments', 'Hotels & Apartments', 'travel_hospitality', now()),
    ('travel_hospitality_travel_packages', 'travel_hospitality_travel_packages', 'Travel Packages', 'travel_hospitality', now()),
    ('travel_hospitality_car_hire', 'travel_hospitality_car_hire', 'Car Hire', 'travel_hospitality', now()),
    ('travel_hospitality_tour_guides', 'travel_hospitality_tour_guides', 'Tour Guides', 'travel_hospitality', now()),
    ('travel_hospitality_visa_assistance_services', 'travel_hospitality_visa_assistance_services', 'Visa Assistance Services', 'travel_hospitality', now()),
    -- 14. Kids & Babies
    ('kids_babies_baby_clothing', 'kids_babies_baby_clothing', 'Baby Clothing', 'kids_babies', now()),
    ('kids_babies_toys', 'kids_babies_toys', 'Toys', 'kids_babies', now()),
    ('kids_babies_school_supplies', 'kids_babies_school_supplies', 'School Supplies', 'kids_babies', now()),
    ('kids_babies_babysitting_services', 'kids_babies_babysitting_services', 'Babysitting Services', 'kids_babies', now()),
    ('kids_babies_kids_event_services', 'kids_babies_kids_event_services', 'Kids Event Services', 'kids_babies', now()),
    -- 15. Other Services
    ('other_services_repair_services', 'other_services_repair_services', 'Repair Services', 'other_services', now()),
    ('other_services_personal_errands', 'other_services_personal_errands', 'Personal Errands', 'other_services', now()),
    ('other_services_security_services', 'other_services_security_services', 'Security Services', 'other_services', now()),
    ('other_services_cleaning_services', 'other_services_cleaning_services', 'Cleaning Services', 'other_services', now()),
    ('other_services_handyman_services', 'other_services_handyman_services', 'Handyman Services', 'other_services', now())
ON CONFLICT (slug) DO NOTHING;
