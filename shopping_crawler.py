"""
shopping_crawler.py
====================

This module implements a small framework for scraping product data from several
major South‑Korean e‑commerce websites using Selenium.  It was written for
educational purposes and should be customised as the HTML structure of the
target sites evolves.  The script reads one or more search keywords from the
command line, visits each requested shopping site, extracts product details and
writes the aggregated results into an Excel spreadsheet using pandas.

**Important legal notice**
-------------------------

Web scraping can raise legal and ethical issues.  Before running this script
against any website you must review that site's `robots.txt` file and terms of
use.  The Korean blog *생활지혜왕* explains that scrapers should respect
`robots.txt`, check the site's terms and avoid overloading the server with
excessive requests【220189409787281†L103-L110】.  It is also important not to
collect personal or sensitive information.  Always insert appropriate delays
between requests and limit the number of pages you visit to avoid being
perceived as abusive.  The examples in this script include short pauses (via
``time.sleep``) and limit the number of products fetched per query; adjust
these values upward cautiously.

Dependencies
------------

This script depends on the following Python packages:

* ``selenium`` – for driving a browser programmatically.  Selenium is
  necessary when scraping modern, JavaScript‑heavy pages because it can
  execute scripts and simulate user interactions【603007171400751†L63-L71】.
* ``webdriver_manager`` – automatically downloads the correct Chrome driver
  binary for your installed version of Chrome.
* ``pandas`` – used to assemble the scraped dictionaries into a DataFrame
  and export them to Excel.
* ``openpyxl`` – used by pandas to write ``.xlsx`` files.

If these packages are not installed in your environment you can add them via
``pip install selenium webdriver-manager pandas openpyxl``.  Note that some
execution environments (such as Jupyter kernels provided by cloud services) may
restrict network access or the ability to download browser drivers; in that
case you should install the packages and drivers locally on your machine.

Usage
-----

Run the script from the command line.  For example:

```
python shopping_crawler.py \
    --keywords "노트북" "모니터" \
    --sites coupang gmarket \
    --max 20 \
    --output results.xlsx
```

This command will search Coupang and G‑Market for the keywords "노트북" and
"모니터", collect up to 20 products per site, and save the aggregated results
in ``results.xlsx``.  If you omit ``--sites`` the script defaults to all
implemented crawlers (currently ``coupang``, ``gmarket`` and ``naver``).  The
order of keywords and sites is preserved in the output.

Design notes
------------

* Each shopping site is scraped by a separate function.  For instance,
  ``crawl_coupang`` visits ``https://www.coupang.com``, enters the search
  keyword, scrolls to load additional results and extracts the product name,
  price, link, rating and review count.  This is adapted from a July 2024
  tutorial showing how to scrape Coupang with Selenium【270003972562312†L70-L119】.
* ``crawl_gmarket_best`` navigates to the G‑Market best seller list and
  iterates over the top items.  It clicks into each product page, reads the
  title, price and category (using CSS selectors), then returns to the list
  before moving to the next item.  This pattern was illustrated in a 2021
  training post【716541512028565†L115-L200】.
* ``crawl_naver_shopping`` demonstrates a simple approach for Naver Shopping.
  Naver's DOM changes frequently, so you will likely need to update the
  selectors.  At minimum the function opens the search page, waits for
  results to load, scrolls down to trigger lazy loading and attempts to
  extract details.  See the "네이버 쇼핑 검색 과정 자동화" article for
  guidance on the attributes worth collecting—title, link, registered date,
  category, price, delivery fee, advertisement flag and seller【603007171400751†L96-L107】.

You can add additional site crawlers by writing new functions following the
same pattern.  When scraping a new site, inspect its HTML with the browser's
developer tools to identify reliable CSS selectors.  Use Selenium's
``WebDriverWait`` to wait for elements to appear and insert ``sleep`` calls
between actions to behave politely.
"""

from __future__ import annotations

import argparse
import sys
import time
from typing import Dict, List, Optional

import pandas as pd
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


def setup_driver(headless: bool = True) -> webdriver.Chrome:
    """Configure and return a Chrome WebDriver.

    The driver runs in headless mode by default.  Additional flags are
    specified to reduce resource usage and mitigate some automation
    detection heuristics.

    Returns
    -------
    webdriver.Chrome
        A ready‑to‑use driver instance.
    """
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")  # Use new headless mode (Chrome >= 109)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    # Spoof a common user agent to reduce the chance of detection.
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.94 Safari/537.36"
    )
    # Create the service and driver.  webdriver_manager downloads the
    # appropriate ChromeDriver binary for the installed version of Chrome.
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver


def crawl_coupang(keyword: str, max_products: int = 50) -> List[Dict[str, str]]:
    """Scrape product information from Coupang for a given search term.

    Parameters
    ----------
    keyword : str
        The search keyword.  Coupang's search box uses the ``q`` name
        attribute for queries, so we simply input the keyword and press
        Enter.
    max_products : int, default=50
        Maximum number of products to return.  Only the first ``max_products``
        results are parsed; if there are fewer results the returned list will
        contain fewer items.

    Returns
    -------
    List[Dict[str, str]]
        A list of dictionaries, each containing product details.  Keys include
        ``site``, ``keyword``, ``name``, ``price``, ``link`` and optional
        ``rating`` and ``reviews``.
    """
    driver = setup_driver(headless=True)
    wait = WebDriverWait(driver, 10)
    results: List[Dict[str, str]] = []
    try:
        driver.get("https://www.coupang.com/")
        # Close the popup if present.  The tutorial suggests there may be a
        # pop‑up when first visiting Coupang【270003972562312†L70-L81】.
        try:
            close_button = wait.until(
                EC.element_to_be_clickable((By.CLASS_NAME, "close"))
            )
            close_button.click()
        except Exception:
            pass
        # Find the search box and enter the keyword.
        search_box = wait.until(
            EC.presence_of_element_located((By.NAME, "q"))
        )
        search_box.clear()
        search_box.send_keys(keyword)
        search_box.send_keys(Keys.RETURN)
        # Wait for at least one product card to appear.
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "search-product")))
        # Scroll to the bottom to trigger lazy loading of products.
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)
        product_cards = driver.find_elements(By.CLASS_NAME, "search-product")
        for card in product_cards[:max_products]:
            try:
                name = card.find_element(By.CLASS_NAME, "name").text
                price = card.find_element(By.CLASS_NAME, "price-value").text
                link = card.find_element(By.TAG_NAME, "a").get_attribute("href")
                rating: Optional[str] = None
                reviews: Optional[str] = None
                # Extract optional rating and review count if available.
                try:
                    rating = card.find_element(By.CLASS_NAME, "rating").text
                except NoSuchElementException:
                    pass
                try:
                    reviews = card.find_element(By.CLASS_NAME, "rating-total-count").text
                except NoSuchElementException:
                    pass
                results.append(
                    {
                        "site": "coupang",
                        "keyword": keyword,
                        "name": name,
                        "price": price,
                        "link": link,
                        "rating": rating,
                        "reviews": reviews,
                    }
                )
            except Exception:
                # Skip entries that cannot be parsed.
                continue
    except TimeoutException:
        print(f"[Coupang] Timeout while loading results for {keyword}")
    finally:
        driver.quit()
    return results


def crawl_gmarket_best(max_products: int = 100) -> List[Dict[str, str]]:
    """Scrape the G‑Market Best Seller list.

    G‑Market publishes a "Bestsellers" page with ranked products.  The
    training exercise from 스마트인재개발원 demonstrates how to iterate
    through the top products, click into each page, extract the title,
    price and category, then return to the list【716541512028565†L115-L200】.  This
    function follows the same procedure.  Since there is no search keyword
    parameter, it simply returns the top items.

    Parameters
    ----------
    max_products : int, default=100
        Maximum number of products to collect.  The G‑Market best seller
        page displays up to 100 items per category; however, this function
        deliberately limits itself to the first 10 items to minimise load.

    Returns
    -------
    List[Dict[str, str]]
        A list of dictionaries with keys ``site``, ``name``, ``price``,
        ``category`` and ``link``.
    """
    driver = setup_driver(headless=True)
    results: List[Dict[str, str]] = []
    try:
        driver.get("http://corners.gmarket.co.kr/Bestsellers")
        time.sleep(2)
        # Only process the first N products; the tutorial used 10
        # iterations【716541512028565†L175-L200】.
        count = min(max_products, 10)
        for i in range(1, count + 1):
            try:
                # Each product link is identified via p#no{i}+div
                item_div = driver.find_element(By.CSS_SELECTOR, f"p#no{i}+div")
                item_div.click()
                time.sleep(2)
                title = driver.find_element(By.CSS_SELECTOR, "h1.itemtit").text
                price = driver.find_element(By.CSS_SELECTOR, "strong.price_real").text
                category = driver.find_element(
                    By.CSS_SELECTOR, "div.location-navi > ul > li:last-child > a"
                ).text
                link = driver.current_url
                results.append(
                    {
                        "site": "gmarket",
                        "name": title,
                        "price": price,
                        "category": category,
                        "link": link,
                    }
                )
                driver.back()
                time.sleep(1)
            except Exception:
                # If anything fails, attempt to return to the list and move on.
                try:
                    driver.back()
                except Exception:
                    pass
                continue
    finally:
        driver.quit()
    return results


def crawl_naver_shopping(keyword: str, max_products: int = 50) -> List[Dict[str, str]]:
    """Scrape product information from Naver Shopping.

    Naver's layout changes often, so this function illustrates a generic
    approach rather than precise selectors.  It opens the search results page
    for the given keyword, scrolls down to load more items, then tries to
    extract product names, prices and links.  You should inspect the HTML of
    the current Naver Shopping results page and adjust the selectors accordingly.

    Parameters
    ----------
    keyword : str
        The search keyword to submit.
    max_products : int, default=50
        Maximum number of products to collect.

    Returns
    -------
    List[Dict[str, str]]
        List of dictionaries with keys ``site``, ``keyword``, ``name``,
        ``price`` and ``link``.  Additional fields may be included if parsed.
    """
    driver = setup_driver(headless=True)
    results: List[Dict[str, str]] = []
    try:
        # Construct a direct search URL.  Using Selenium to type into the
        # search box is also possible, but a URL avoids extra clicks.
        query_url = f"https://search.shopping.naver.com/search/all?query={keyword}"
        driver.get(query_url)
        time.sleep(3)
        # Scroll to load additional products.  Without scrolling, only a
        # handful of items may render.
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        # Identify product containers.  The CSS class names below are
        # illustrative; inspect the live page to find stable selectors.
        containers = driver.find_elements(By.CSS_SELECTOR, "div.product_item")
        if not containers:
            # Try an alternative selector (sometimes the class names differ).
            containers = driver.find_elements(By.CSS_SELECTOR, "li.basicList_item__2XT81")
        for container in containers[:max_products]:
            try:
                # Product name
                try:
                    name = container.find_element(By.CSS_SELECTOR, "a.product_title").text
                except NoSuchElementException:
                    name = container.find_element(By.CSS_SELECTOR, "a.basicList_link__1MaTN").text
                # Price (Naver often wraps price in strong tags)
                try:
                    price = container.find_element(By.CSS_SELECTOR, "span.price").text
                except NoSuchElementException:
                    price = container.find_element(By.CSS_SELECTOR, "span.price_num__2WUXn").text
                # Link to the product page
                link_element = container.find_element(By.TAG_NAME, "a")
                link = link_element.get_attribute("href")
                results.append(
                    {
                        "site": "naver",
                        "keyword": keyword,
                        "name": name,
                        "price": price,
                        "link": link,
                    }
                )
            except Exception:
                continue
    finally:
        driver.quit()
    return results


def main(argv: Optional[List[str]] = None) -> None:
    """Entry point for the command line interface."""
    parser = argparse.ArgumentParser(
        description="Scrape product data from multiple shopping sites and save to Excel"
    )
    parser.add_argument(
        "--keywords",
        nargs="+",
        required=True,
        help="One or more search keywords (for site crawlers that support search)",
    )
    parser.add_argument(
        "--sites",
        nargs="+",
        default=["coupang", "gmarket", "naver"],
        help="List of shopping sites to scrape (coupang, gmarket, naver)",
    )
    parser.add_argument(
        "--max",
        type=int,
        default=50,
        dest="max_products",
        help="Maximum number of products to fetch per keyword per site",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="shopping_results.xlsx",
        help="Name of the output Excel file",
    )
    args = parser.parse_args(argv)

    all_rows: List[Dict[str, str]] = []
    for keyword in args.keywords:
        for site in args.sites:
            site_key = site.lower()
            if site_key == "coupang":
                rows = crawl_coupang(keyword, args.max_products)
                all_rows.extend(rows)
            elif site_key == "gmarket":
                # G‑Market does not use keywords; ignore the keyword argument.
                rows = crawl_gmarket_best(args.max_products)
                # Fill keyword field with None for consistency.
                for row in rows:
                    row["keyword"] = keyword
                all_rows.extend(rows)
            elif site_key == "naver":
                rows = crawl_naver_shopping(keyword, args.max_products)
                all_rows.extend(rows)
            else:
                print(f"Unknown site: {site}. Supported sites are coupang, gmarket and naver.")

    if not all_rows:
        print("No data collected.  Check your keywords and selectors.")
        return
    df = pd.DataFrame(all_rows)
    # Write to Excel using openpyxl engine to avoid the older xls writer.
    df.to_excel(args.output, index=False, engine="openpyxl")
    print(f"Saved {len(df)} rows to {args.output}")


if __name__ == "__main__":
    # Pass through any command line arguments.
    main(sys.argv[1:])