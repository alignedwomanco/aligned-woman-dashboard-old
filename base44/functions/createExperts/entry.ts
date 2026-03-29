import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all categories
    const categories = await base44.asServiceRole.entities.ExpertCategory.list();
    
    // Map category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    const expertsData = [
      // Phase 2: Liberation
      {
        name: "Natacha Wauquiez",
        title: "Trauma-Informed Therapist | Nervous System Healing",
        category: categoryMap["Nervous System & Emotional Health"],
        bio: "Natacha supports women in understanding how trauma and chronic stress are stored in the body. Her work focuses on gently moving from survival patterns into emotional safety and stability.",
        isPublished: true
      },
      {
        name: "Wendy Mahoney",
        title: "Behavioural Specialist | NLP Master Practitioner & Trainer | Business Innovation Expert",
        category: categoryMap["Mindset & Behaviour"],
        bio: "Wendy helps women identify and shift unconscious patterns and conditioning that influence their decisions. Her work supports lasting behavioural change without sacrificing ambition or momentum.",
        isPublished: true
      },
      {
        name: "Marley Rose Harris",
        title: "Money Mindset Coach | Subconscious Reprogramming Specialist",
        category: categoryMap["Mindset & Behaviour"],
        bio: "Marley helps women understand how subconscious beliefs shape their financial reality. She teaches practical tools to shift money patterns and expand capacity for wealth without self-sabotage.",
        isPublished: true
      },
      // Phase 3: Intention
      {
        name: "Nasrat \"Edoo\" Sirkissoon",
        title: "Financial Educator | Investment & Wealth Specialist",
        category: categoryMap["Money & Finances"],
        bio: "Nasrat helps women build a clear, grounded understanding of money, from budgeting to investing. His approach focuses on practical financial literacy that supports confident, aligned decision-making.",
        isPublished: true
      },
      {
        name: "Nokuthula \"Nox\" Magwaza",
        title: "CEO | Leadership Coach | Purpose & Values Alignment Specialist",
        category: categoryMap["Business, Leadership & Career"],
        bio: "Nox helps women define what truly matters to them and align their decisions with their values. Her work supports authentic leadership rooted in clarity rather than pressure or expectation.",
        isPublished: true
      },
      {
        name: "Refilwe Moloto",
        title: "Economic & Strategic Advisor | Award-Winning Broadcaster",
        category: categoryMap["Business, Leadership & Career"],
        bio: "Refilwe is an economic and strategic advisor who helps women understand power, communication, and decision-making in real-world environments. She supports confident leadership grounded in clarity and credibility.",
        isPublished: true
      },
      // Phase 4: Vision & Embodiment
      {
        name: "Cindy Norcott",
        title: "CEO | Entrepreneur | Leadership & Career Development Expert",
        category: categoryMap["Business, Leadership & Career"],
        bio: "Cindy helps women gain clarity on their direction and step into leadership with confidence. Her work focuses on building self-belief and creating sustainable, aligned career paths.",
        isPublished: true
      },
      {
        name: "Tinashe Mujera",
        title: "Brand & Marketing Expert | Transformational Leadership Coach | Best-Selling Author",
        category: categoryMap["Identity, Brand & Relationships"],
        bio: "Tinashe is a marketing strategist with over a decade of experience helping brands grow through clear positioning, communication, and strategy. She combines commercial insight with leadership coaching to support individuals and organisations in building impactful brands and meaningful growth.",
        isPublished: true
      },
      {
        name: "Mimi Nicklin",
        title: "Empathy Advocate | Author | Founder of Empathy Everywhere",
        category: categoryMap["Identity, Brand & Relationships"],
        bio: "Mimi helps women strengthen connection, communication, and influence through empathy. Her work focuses on how you are experienced by others and how to build trust and impact in every environment.",
        isPublished: true
      }
    ];

    const created = await base44.asServiceRole.entities.Expert.bulkCreate(expertsData);
    
    return Response.json({ 
      success: true, 
      count: created.length,
      experts: created 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});