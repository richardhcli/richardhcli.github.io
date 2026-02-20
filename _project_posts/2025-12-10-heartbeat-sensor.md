---
title: "Heartbeat sensor using pure components"
description: "A successful build for my ECE Lab"
date: 2025-12-10
tags:
  - Electrical Engineering
  - Signal processing
  - Biomedical 
github_url: ""
demo_url: ""
---

## Overview
This is a virtual display of my heartbeat sensor I (with a lab partner) made, debugged, and presented for Purdue's ECE 20008 Lab. 

Pipeline: IR LED -> finger -> phototransistor sensor -> filtered signal (high pass, low pass) -> 1bit ADC -> LED indicator

### Demo video:
<video controls preload="metadata" class="post-video">
  <source src="{{ '/assets/videos/projects/2025-12-10-20251204_134457.mp4' | relative_url }}" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Key Points
- Each module in the pipeline was individually tested, confirmed, and integrated. Using this method, the project was sucessful overall! 


## Details
Full technical details, SPICE schematics, and oscilloscope measurements in writeup here: [Final Project Report]({{ '/assets/pdfs/projects/2025-12-10-FinalProjectReport_li5042.pdf' | relative_url }})


## Lessons Learned / Conclusion

This project was a clear visual indicator of my EE progress: I was able to make a working 'machine' with just components-- a result greater than the simple sum of its parts!

Each part was so much more complex than expected. However, I was able to create a final writeup summarizing these struggles, and I learned how to better judge the difficulty of ECE projects (you can't just prompt hardware!). 
Overall, from this experience, I better understand the concepts of signal processing (preprocessing: filters, ADC) and the role of electrical engineering in fullstack systems: EE primarily servces as the interface between digital systems and the real world, acting as a grounding force (to make it actually exist and interactable) and the main IO mechanism / connector (the systems are digital, but the connectors are always analog). 

Using this information, I better know what I want to do in the future! 