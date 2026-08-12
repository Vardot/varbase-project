@smoke @regression @any @content
Feature: Website Base Requirements - Front-end pages
      As a site visitor
      I want every front-end page to be healthy
      So that I can navigate, read and trust the site on any page.

  @check @local @development @staging @production
  Scenario Outline: The <name> page is healthy
    Given I am an anonymous user
     When I go to "<path>"
      And wait
     Then the page should have a working header
      And the page should have a working footer
      And the page should have a main landmark
      And the page should have a navigation landmark
      And the page should have a skip link
      And the page should declare a language
      And the page should have a title
      And there should be no JavaScript errors

    Examples: Canvas pages
      | name          | path           |
      | Home          | /              |
      | Features      | /features      |
      | About Varbase | /about-varbase |
      | Blog          | /blog          |
      | Contact Us    | /contact-us    |

    Examples: Blog articles
      | name                       | path                                                                  |
      | Blog - Getting started     | /blog/getting-started-varbase-step-step-guide-first-time-users        |
      | Blog - Why Varbase         | /blog/why-varbase-ultimate-drupal-distribution-accelerated-development |
      | Blog - Customizing         | /blog/customizing-your-website-varbase-flexibility-and-freedom         |
      | Blog - Security            | /blog/enhancing-your-websites-security-varbase                         |
      | Blog - SEO                 | /blog/how-varbase-optimizes-your-site-search-engines                   |
      | Blog - Performance         | /blog/maximizing-performance-varbase-tips-and-tricks-site-optimization |
      | Blog - Third-party         | /blog/integrating-third-party-applications-varbase                     |
      | Blog - Mobile-first        | /blog/varbase-mobile-first-platform-building-responsive-websites       |
      | Blog - Community           | /blog/community-behind-varbase-support-and-collaboration               |
      | Blog - E-commerce          | /blog/leveraging-varbase-e-commerce-features-transform-your-online-store |
      | Blog - Multilingual        | /blog/multilingual-websites-made-easy-varbase                          |
      | Blog - Case studies        | /blog/case-studies-successful-websites-powered-varbase                 |

  @check @local @development
  Scenario Outline: The <name> content page has a working header and footer
    Given I am a logged in user with the "webmaster" user
     When I go to "<path>"
      And wait
     Then the page should have a working header
      And the page should have a working footer
      And the page should have a main landmark
      And the page should have a skip link
      And the page should declare a language
      And the page should have a title

    Examples: Content pages
      | name                     | path                           |
      | Privacy policy           | /privacy-policy                |
      | Accessibility tools demo | /accessibility-tools-demo-page |
