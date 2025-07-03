import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Check, Star, Clock, DollarSign, Menu, X, Sparkles, BrainCircuit, Sun, Moon, Wrench } from 'lucide-react';

// Custom hook to detect when an element is on screen for animations
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isVisible];
};


// The main App component for the website
const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  
  // State for the AI Job Estimator
  const [jobDescription, setJobDescription] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect to set initial theme and handle theme changes
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeSwitch = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Function to smoothly scroll to a section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };
  
  // Refs for scroll animations
  const [heroRef, heroIsVisible] = useOnScreen({ threshold: 0.1 });
  const [servicesRef, servicesIsVisible] = useOnScreen({ threshold: 0.1 });
  const [estimatorRef, estimatorIsVisible] = useOnScreen({ threshold: 0.1 });
  const [aboutRef, aboutIsVisible] = useOnScreen({ threshold: 0.1 });
  const [contactRef, contactIsVisible] = useOnScreen({ threshold: 0.1 });

  // --- Gemini API Call for Job Estimator ---
  const handleEstimate = async () => {
    if (!jobDescription) {
      setError('Please describe the job first!');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEstimate(null);

    // --- FULLY UPGRADED PROMPT FOR MAXIMUM ACCURACY ---
    const prompt = `
      You are an expert estimator for a 16-year-old's local service business in Temecula, CA. Your goal is to provide a helpful, non-binding estimate that is as accurate as possible based on the information provided.

      --- MY BUSINESS PROFILE ---
      1.  **My Pricing Tiers:**
          * **Skilled Indoor Rate: $20/hour** (Use for: Furniture Assembly, Organizing, Moving light furniture).
          * **General Labor Rate: $17/hour** (Use for: Yard Work, Tech Help, Babysitting, general manual labor).
          * **Flat-Rate Services:**
            * Basic EXTERIOR Car Wash: $25 (takes about 1 hour).
            * 30-Minute Dog Walk: $15.
            * Weekly Pooper Scooper Service: $10 (for a standard backyard).
            * Weekly Trash Can Duty: $7.

      2.  **My Tools & Abilities:**
          * **Yard Work:** I have a lawn mower, leaf blower, rake, shovel, hedge trimmers, a weed wacker, and a wheelbarrow.
          * **Car Washing:** I have soap, microfiber towels, and a hose with a spray nozzle. I DO NOT have an interior vacuum. My service is exterior-only.
          * **Indoor Work:** I can assemble flat-pack furniture (like IKEA), organize garages/closets, and move light furniture within a house. I have basic hand tools.
          * **Hauling:** I DO NOT have a truck. I can only dispose of small amounts of junk that fit in a standard residential trash can.

      3.  **Job Boundaries (Very Important):**
          * **Decline if:** The job requires a licensed professional (electrical, plumbing, roofing, engine repair, permits), requires tools I don't have (pressure washer, large truck for hauling), or is unsafe.
          * **Be specific:** For jobs like "weeding," if the user doesn't specify an area size, base the estimate on a "small garden bed" and state that the price will change based on the actual size.

      --- CUSTOMER'S JOB REQUEST ---
      "${jobDescription}"

      --- YOUR TASK ---
      Analyze the customer's request based on my detailed business profile. Provide your response as a JSON object with this exact structure. Be realistic.

      {
        "is_doable": boolean,
        "confidence_score": "string (e.g., 'High', 'Medium', 'Low' - based on how clear the user's description is)",
        "estimated_time": "string (e.g., 'Approx. 2-3 hours' or 'N/A')",
        "suggested_price": "string (e.g., '$40 - $60' or 'N/A')",
        "breakdown": ["string", "string", "..."],
        "friendly_note": "string (A short, encouraging note. If declining, politely explain why based on my boundaries.)"
      }
    `;
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const rawJson = result.candidates[0].content.parts[0].text;
        const parsedEstimate = JSON.parse(rawJson);
        setEstimate(parsedEstimate);
      } else {
        throw new Error("No response from the estimator. Please try again.");
      }

    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't generate an estimate right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-['Inter',sans-serif]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="font-bold text-xl text-blue-600 dark:text-blue-500 cursor-pointer" onClick={() => scrollToSection('hero')}>Fearing's Services</div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('services')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 transition-colors font-medium">Services</button>
              <button onClick={() => scrollToSection('estimator')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 transition-colors font-medium flex items-center"><Sparkles className="w-4 h-4 mr-1 text-yellow-500"/>Estimator</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 transition-colors font-medium">My Goal</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 transition-colors font-medium">Contact</button>
              <button onClick={handleThemeSwitch} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={handleThemeSwitch} className="text-gray-700 dark:text-gray-300 mr-4">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection('services')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700">Services</button>
              <button onClick={() => scrollToSection('estimator')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700">✨ Estimator</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700">My Goal</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700">Contact</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" ref={heroRef} className={`pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 transition-opacity duration-1000 ease-in ${heroIsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">Fearing's Services</h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 font-medium">Reliable Help For Your To-Do List.</p>
            <p className="text-lg text-gray-700 dark:text-gray-400 mb-10 max-w-2xl mx-auto">Professional local services by a dedicated student athlete. From tech support to yard work, I'm here to help with clear pricing and reliable service.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => scrollToSection('services')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform">See My Services</button>
              <button onClick={() => scrollToSection('contact')} className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 transition-all hover:-translate-y-0.5 transform">Contact Me</button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" ref={servicesRef} className={`py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-opacity duration-1000 ease-in transform ${servicesIsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Services & Pricing</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Clear, upfront pricing so you know exactly what to expect. No surprises.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 dark:text-blue-300 font-medium">Don't see what you need? Just ask! I'm willing to do other jobs not listed.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-fit mx-auto">
            {/* Skilled Indoor Services */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all transform duration-300">
              <div className="flex items-center mb-6"><Wrench className="h-8 w-8 text-blue-600 dark:text-blue-500 mr-3" /><h3 className="text-2xl font-bold text-gray-900 dark:text-white">Skilled Indoor Services</h3></div>
              <div className="bg-blue-600 text-white rounded-lg p-4 mb-6 text-center"><div className="text-3xl font-bold">$20</div><div className="text-blue-100">per hour</div></div>
              <ul className="space-y-4">
                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Tech Troubleshooting</span></li>
                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Furniture Assembly</span></li>
                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Moving Light Furniture</span></li>
              </ul>
            </div>
            {/* General Labor Services */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all transform duration-300">
              <div className="flex items-center mb-6"><Clock className="h-8 w-8 text-blue-600 dark:text-blue-500 mr-3" /><h3 className="text-2xl font-bold text-gray-900 dark:text-white">General Labor Services</h3></div>
              <div className="bg-blue-600 text-white rounded-lg p-4 mb-6 text-center"><div className="text-3xl font-bold">$17</div><div className="text-blue-100">per hour</div></div>
              <ul className="space-y-4">
                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Yard Work & Cleanup</span></li>
                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Babysitting</span></li>
              </ul>
            </div>
            {/* Flat-Rate Services */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all transform duration-300">
              <div className="flex items-center mb-6"><DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-500 mr-3" /><h3 className="text-2xl font-bold text-gray-900 dark:text-white">Flat-Rate Services</h3></div>
              <ul className="space-y-4">
                <li className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><div className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Exterior Car Wash</span></div><span className="font-bold text-blue-600 dark:text-blue-400">$25</span></li>
                <li className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><div className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">30-Min Dog Walk</span></div><span className="font-bold text-blue-600 dark:text-blue-400">$15</span></li>
                <li className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><div className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Weekly Pooper Scooping</span></div><span className="font-bold text-blue-600 dark:text-blue-400">$10</span></li>
                <li className="flex items-center justify-between py-2"><div className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Weekly Trash Can Duty</span></div><span className="font-bold text-blue-600 dark:text-blue-400">$7</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Job Estimator Section */}
      <section id="estimator" ref={estimatorRef} className={`py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50 transition-opacity duration-1000 ease-in transform ${estimatorIsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white p-3 rounded-full mb-4"><BrainCircuit className="w-8 h-8"/></div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">✨ AI-Powered Job Estimator</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Have a custom job? Describe it below and get an instant, non-binding estimate!</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <textarea
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows="4"
              placeholder="Be specific! Include details like the size of the area (e.g., 'small front yard'), number of items ('three bushes to trim'), or any special requirements."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
            <button
              onClick={handleEstimate}
              disabled={isLoading}
              className="mt-4 w-full bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Estimate...
                </>
              ) : "Estimate Job"}
            </button>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
          {estimate && (
            <div className={`mt-8 p-8 rounded-2xl transition-all duration-500 ${estimate.is_doable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} border-2`}>
                <h3 className="text-2xl font-bold text-center mb-4 dark:text-white">{estimate.is_doable ? "Here's a Potential Plan:" : "A Note on This Job"}</h3>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Confidence</p>
                        <p className={`text-2xl font-semibold ${estimate.confidence_score === 'High' ? 'text-green-600' : estimate.confidence_score === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>{estimate.confidence_score}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Estimated Time</p>
                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{estimate.estimated_time}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Suggested Price</p>
                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{estimate.suggested_price}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Potential Breakdown</p>
                    <ul className="mt-2 space-y-2 list-inside">
                        {estimate.breakdown.map((step, index) => (
                            <li key={index} className="flex items-start bg-white dark:bg-gray-800 p-3 rounded-md">
                                <Check className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0"/>
                                <span className="dark:text-gray-300">{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-6 text-center bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 italic">"{estimate.friendly_note}"</p>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">*This is an AI-generated, non-binding estimate. Actual time and cost may vary. Let's talk to confirm the details!</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className={`py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-opacity duration-1000 ease-in transform ${aboutIsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">My Name is Grant Fearing</h2>
              <div className="prose prose-lg text-gray-700 dark:text-gray-300 dark:prose-invert leading-relaxed">
                <p className="mb-6">I'm a 16-year-old student and a dedicated wrestler at Temecula Valley High School. Wrestling has taught me discipline, responsibility, and the value of hard work—qualities I bring to every job I do.</p>
                <p className="mb-6">Every dollar I earn from Fearing's Services goes directly toward funding my wrestling season, helping me cover costs for travel and tournaments.</p>
                <p className="mb-6">When you hire me, you're not just getting a task done; you're supporting a local student athlete's dream.</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">Thank you for your support!</p>
              </div>
              <div className="mt-8 flex items-center space-x-4"><Star className="h-6 w-6 text-yellow-500" /><span className="text-gray-600 dark:text-gray-400">Temecula Valley High School Student Athlete</span></div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative"><img src="https://placehold.co/600x400/3B82F6/FFFFFF?text=Grant+Fearing" alt="Grant Fearing - Student Athlete" className="w-full h-96 object-cover rounded-xl shadow-lg"/><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactRef} className={`py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 transition-opacity duration-1000 ease-in transform ${contactIsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-12">Contact me today for reliable, professional service</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <a href="tel:951-517-9088" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group transform hover:-translate-y-1"><Phone className="h-8 w-8 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" /><h3 className="text-xl font-semibold text-white mb-2">Call or Text</h3><p className="text-blue-100 text-lg">951-517-9088</p></a>
            <a href="mailto:GrantFearing@proton.me" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group transform hover:-translate-y-1"><Mail className="h-8 w-8 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" /><h3 className="text-xl font-semibold text-white mb-2">Email Me</h3><p className="text-blue-100 text-lg">GrantFearing@proton.me</p></a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-300 mb-2">© 2024 Fearing's Services. All Rights Reserved.</p>
          <p className="text-gray-400 text-sm">Supporting a Temecula Valley High School Student Athlete</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
