---
title: "Nook"
description: "Winner of Claude Hackathon"
date: 2026-04-10
tags:
 - LLM
 - Mapbox
 - hackathon
github_url: https://github.com/ObviAvi/Nook
---

Woohoo! Finally won my first hackathon! 
Focusing completely on the MVP (minimal viable product) was what allowed us to be successful. 

# Hackathon description: 
Devpost: https://devpost.com/software/nook-d0fl7g


## Inspiration
Apartment finders focus on immediate apartment specifications, but not the surrounding environment. As college students (as well as interns, new grads, new parents), we just want minimal apartment specifications for minimal price, where we really care about the surrounding amenities and surrounding environment - what services we can easily access, either by foot or by mobile.

Not only this, surroundings are also very important for families as well.

With the current housing crisis (rising housing prices), finding a good housing or apartment is harder than ever. that's why we built nook

## What it does
Nook allows users to rank their environmental preferences (eg: gym, restaurants, parks...) and then uses an scored algorithm to find the closest, most compatible apartment listing to user criteria.

## How we built it
Frontend: React.js Technologies: mapbox for map UI, overpass API for amenities search, gemini for backend prompting

## Challenges we ran into
Parallelism: working in parallel was difficult, but using properly defined interfaces, we were able to do it well. LLM integration: getting a LLM call proved to be surprisingly challenging, due to drastic architectural modifications.

## Accomplishments that we're proud of
Mapbox integration: we didn't know how to use this before the hackathon and learned how to overlay amenities to this on the spot.
Won "Code for Humanity (Impact!)" track

## What we learned
Parallel work is possible and make easy with properly defined interfaces between components
What's next for Nook
fleshed out LLM integration allowing for direct user prompting
use rentcast to fetch rental data live

## Built With
javascript
mapbox
openstreetmap
react

## Try it out
 nook-inky.vercel.app
