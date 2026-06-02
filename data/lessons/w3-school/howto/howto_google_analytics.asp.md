# How to Set Up Google Analytics

Google Analytics is used to view and understand web traffic.

It is free and easy to use.

You can customize it for many use cases.

It works out of the box.

It is fast to set up. Get your insights today!

* * *

Skip reading about Google Analytics. Take me directly to the first step. [Go to the first step](howto_google_analytics.asp.html#step-1)

## What is Google Analytics

Google Analytics is a web analytics solution.

It is developed and supported by Google.

The newest version is called Google Analytics 4.

It can be used to view data such as audience, page views, sessions and, demographics, and events.

## Why enable Google Analytics

Understand your web traffic to make better decisions.

Understand and improve the sales funnel.

Learn from experimenting (for example, a/b tests).

Google has another solution called Google Optimize. This solution is made for testing.

* * *

## Who is Google Analytics for

Google Analytics is useful for anyone who has a website.

It gives you information about who uses your site and how they interact with it.

In addition, interface is easy to understand.

You do not need an analytics background to use and navigate the service.

* * *

## How to set up Google Analytics step-by-step

Google Analytics can be set up in two ways **The Global Website Tag (gtag.js)** or **Google Tag Manager**.

The easiest way is to use The Global Website Tag.

This tutorial will use the The Global Website Tag approach.

* * *

## Preparations

Decide which code editor to use and set up your environment.

W3Schools has created an easy-to-use code editor called **W3Schools Spaces**. Sign up and get started in a few clicks.

[Start for free ❯](https://www.w3schools.com/spaces/)

Create your **index.html** file so that you are ready to enter the code.

**All setup. Let's go!**

* * *

## Set up Google Analytics: The Global Website Tag

* * *

## Step 1: Create a Google Analytics account

Go to Analytics: [Create an account or sign in to Analytics](https://google.com/analytics)

The link in the paragraph above takes you to the Google Analytics landing page.

Click the "Start for free" button.

![landing page](Landingpage_Google_Analyitcs.png)

* * *

* * *

## Step 2: Enter the welcome page

After creating an account or signing in, you are welcomed to the solution.

Press the "Start measuring" button to proceed.

![Welcome page](welcome_to_analytics.png)

* * *

## Step 3: Account setup

You have two decisions to make here.

1.  Enter your account name.
2.  Decide what data you want to share.
3.  Click the "Next" button.

One account can have more than one tracking ID. You can track more than one website with an account.

![Account setup overview](account_setup.png)

* * *

## Step 4: Property setup

Property is the service you measure, such as a website, application, link tree, etc.

1.  Enter a property name.
2.  Enter your time zone.
3.  Enter the currency that you use.
4.  Click the "Next" button.

![Property setup overview](property_setup.png)

* * *

## Step 5: Add business information

Analytics uses the information to tailor your experience.

1.  Select your industry category.
2.  Select business size.
3.  Tick the boxes for how you are planning to use Analytics.
4.  Click the "Create" button to proceed.

![Business information details](business_information.png)

* * *

## Step 6: Terms of Service Agreement

Read and understand the terms of service.

Tick the GDPR box and click the "I accept" button if you agree.

![Terms and conditions overview](terms.png)

* * *

## Step 7: Email subscriptions

1.  Tick or uncheck all boxes.
2.  Click the "Save" button to continue.

![Email communication overview](email_com.png)

* * *

## Step 8: Select platform

Chose the platform where you are collecting data.

Then, click the relevant platform to continue.

We are continuing with "Web" as the example in this tutorial.

![Select platform overview](setup_datastream.png)

* * *

## Step 9: Data stream setup

Enter data stream details.

1.  The URL to your site.
2.  The name that you want to give the stream.
3.  Decide if you are to enable enhanced measurement or not.
4.  Click on the "Create stream" button to continue.

The enhanced measurement can give the data more context. Improving your understanding of the traffic.

![Data stream setup overview](setup_datastream2.png)

* * *

## Step 10: Web stream overview

Here you can see a detailed overview of the web stream.

![Web stream details overivew](web_stream_details.png)

**Here are the key takeaways from the overview.**

**1\. Stream URL.**

The Stream URL is the link to the connected site.

![stream URL](stream_url.png)

**2\. Measurement ID**

The Measurement ID is the identifier for your data stream.

It has a format of G-XXXXXXX.

![measurement ID](measurement_id.png)

Google Analytics 4 uses Measurement ID. Older versions use Tracking ID. You can not have both.

**3\. Tagging instructions**

Decide to use **Global site tag (gtag.js)** or **Tag manager**.

This tutorial will use the Global site tag.

Installing the Global site tag is the easiest and quickest way of getting it up and running.

![tagging instructions](tagging_instructions.png)

## Step 11: Global site tag (gtag.js)

Click the "Global site tag (gtag.js)" row.

![Global site tag](global_site_tag.png)

Here you can see a code snippet.

The code snippet is a script to allow Google to measure data on your site.

You can see the Measurement ID in the second last line in the code snippet.

```javascript
<!-- Global site tag (gtag.js) - Google Analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=G-DNJN1PF3CS"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-XXXXXXX');</script>
```

* * *

## Step 12: Enter the code snippet

Copy the code snippet.

Make sure to include your Measurement ID.

Locate the <head> tag in your HTML.

Paste the code snippet just below the <head> tag.

Save and publish the code.

![Add code snippet](add_codesnippet.png)

We used [W3Schools Spaces](https://www.w3schools.com/spaces/) in this example.

* * *

## Step 13: Test that it works

Ensure that you have successfully saved and published the code snippet with the correct Measurement ID.

Open the URL for the site you have connected to the data stream.

Click on "Real time" on the menu to the left.

Confirm that you see yourself as an active user.

**Congrats. You have successfully enabled Google Analytics for your site!**

![Analytics dashboard](realtime.png)

* * *

## Explore Google Analytics

Recommended related topics are **Tag manager** and **Events**

Spend time in the service to learn about your user activity, commerce, demographics, device, and referrals.

* * *

**Tip:** Ever heard of W3Schools Spaces? It is a personal space where you can make a website from scratch or use a template.

It has everything you need in the browser.

Get started in a few clicks.

[Start now for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_