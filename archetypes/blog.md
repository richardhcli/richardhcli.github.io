{{- $name := .Name -}}
{{- $slug := $name -}}
{{- $date := substr .Date 0 10 -}}
{{- if and (ge (len $name) 11) (eq (substr $name 10 1) "-") -}}
{{- $prefix := substr $name 0 10 -}}
{{- if findRE "^[0-9]{4}[.][0-9]{2}[.][0-9]{2}$" $prefix -}}
{{- $slug = substr $name 11 -}}
{{- $date = replace $prefix "." "-" -}}
{{- end -}}
{{- end -}}
---
title: "{{ replace (replace $slug "_" " ") "-" " " | title }}"
description: ""
date: {{ $date }}
slug: {{ $slug }}
tags: []
draft: true
---
