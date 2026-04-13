---
title: "Catapult Hackathon @ Purdue"
description: "Creating a agentic machine learning framework"
date: 2026-04-03
tags:
  - agents
  - hackathon
  - automation
  - hyperparameter tuning
github_url: "https://github.com/DevashishDas3/machine-learn/tree/rcac_endpoint"
---


## Overview

This semester, I took part in a group of (new) friends in Purdue's Catapult hackathon (https://catapulthack-2026.devpost.com/). 

We didn't win, but I stil learned so much, and used this experience to win another hackathon!

Devpost: https://devpost.com/software/machine-learn
View the github readme for more information! 

Huge thanks to my teammates for letting me hop on at the last second! They are all amazing people, and I would be honored to work with them again: 
https://www.aviaggarwal.org/
https://www.akashravandhu.com/projects/machine-learn
https://devashishdas.vercel.app/
https://www.zekeprojects.com/



## Key Points

The problem we wanted to solve was automation of hyperparamter tuning and code generation for machine learning models. 

Ideally, engineers with not much ML experience or ML architects doing the initial hyperparamter / architecture sweep would be able to prompt our agent, which would then generate various possible architectures (CNN, random forest, etc), and per each architecture, hyperparemter tuning using agents viewing containerized workspaces would be used. 

This had the interesting effect of making a dumber model "smarter" by feeding its prompts, code generation, and code output back into itself and allowing it to re-iterate over the code it generated. 

## Details

We used modal for the containers, and a full stack react - supabase. 

My work was on the backend, setting up a high performance compute locally-hosted LLM  (qwen 32B) using purdue's RCAC servers. 
I had a lot of trouble routing information outside to an external endpoint, and ultimately had to route things through my mini pc in my dorm-- I suppose I set up a reverse proxy by hand... 

## Lessons Learned / Conclusion

Anyways, the key point learned was the importance of the MVP: minimal viable product. I had so much ideas, but I really should have cut down, eg: used a gemini api endpoint while I was implementing by code, so that my team members had something to work with-- scaffolding. 