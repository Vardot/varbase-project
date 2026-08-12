@smoke @regression @slow @any @content
Feature: Website Base Requirements - Front-end pages warm-up
      As the test runner
      I want each public page visited once at every testing breakpoint before the health checks
      So that the default theme image derivatives are generated and cached first.

  # The default theme renders responsive images through drimage_improved, which
  # generates a WebP derivative per rendered width on the fly. The first request
  # for a derivative can be dropped while it is still being generated (most
  # visibly under HTTP/2), which later surfaces as a console resource error on
  # the 01-06 health checks. Visiting each page once at every viewport breakpoint
  # from the testing settings primes the derivative cache for all widths, so the
  # health checks serve them as static files. This warm-up makes no assertions.

  @check @local @development @staging @production
  Scenario Outline: Warm up the <name> page across all breakpoints
    Given I am an anonymous user
     When I warm up "<path>" at all testing breakpoints

    Examples: Canvas pages
      | name          | path           |
      | Home          | /              |
      | Features      | /features      |
      | About Varbase | /about-varbase |
      | Blog          | /blog          |
      | Contact Us    | /contact-us    |

    Examples: Blog articles
      | name                   | path                                                                    |
      | Blog - Getting started | /blog/getting-started-varbase-step-step-guide-first-time-users          |
      | Blog - Why Varbase     | /blog/why-varbase-ultimate-drupal-distribution-accelerated-development   |
      | Blog - Customizing     | /blog/customizing-your-website-varbase-flexibility-and-freedom           |
      | Blog - Security        | /blog/enhancing-your-websites-security-varbase                           |
      | Blog - SEO             | /blog/how-varbase-optimizes-your-site-search-engines                     |
      | Blog - Performance     | /blog/maximizing-performance-varbase-tips-and-tricks-site-optimization   |
      | Blog - Third-party     | /blog/integrating-third-party-applications-varbase                       |
      | Blog - Mobile-first    | /blog/varbase-mobile-first-platform-building-responsive-websites         |
      | Blog - Community       | /blog/community-behind-varbase-support-and-collaboration                 |
      | Blog - E-commerce      | /blog/leveraging-varbase-e-commerce-features-transform-your-online-store |
      | Blog - Multilingual    | /blog/multilingual-websites-made-easy-varbase                            |
      | Blog - Case studies    | /blog/case-studies-successful-websites-powered-varbase                   |
