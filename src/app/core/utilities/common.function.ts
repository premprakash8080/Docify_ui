import { MatDateFormats, NativeDateAdapter } from "@angular/material/core";

export function IsEmptyObject(obj: any) {
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  else return false;
}

export function groupBy(column: string, data: any[], reducedGroups?: any[]) {
  if (!column) return data;
  let collapsedGroups = reducedGroups;
  if (!reducedGroups) collapsedGroups = [];
  const customReducer = (accumulator, currentValue) => {
    let currentGroup = currentValue[column];
    if (!accumulator[currentGroup])
      accumulator[currentGroup] = [
        {
          groupName: `${currentValue[column]}`,
          value: currentValue[column],
          isGroup: true,
          reduced: collapsedGroups.some(
            (group) => group.value == currentValue[column]
          ),
        },
      ];

    accumulator[currentGroup].push(currentValue);

    return accumulator;
  };
  let groups = data.reduce(customReducer, {});
  let groupArray = Object.keys(groups).map((key) => groups[key]);
  let flatList = groupArray.reduce((a, c) => {
    return a.concat(c);
  }, []);
  return flatList.filter((rawLine) => {
    return (
      rawLine.isGroup ||
      collapsedGroups.every((group) => rawLine[column] != group.value)
    );
  });
}
export function GetDate(
  date?: any,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string {
  let jsonDate;
  if (date) jsonDate = new Date(date);
  else jsonDate = new Date();
  
  // Replace moment format with native Date formatting
  const year = jsonDate.getFullYear();
  const month = String(jsonDate.getMonth() + 1).padStart(2, '0');
  const day = String(jsonDate.getDate()).padStart(2, '0');
  const hours = String(jsonDate.getHours()).padStart(2, '0');
  const minutes = String(jsonDate.getMinutes()).padStart(2, '0');
  const seconds = String(jsonDate.getSeconds()).padStart(2, '0');
  
  if (format === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function GetDateOnly(
  date?: any,
  format: string = "YYYY-MM-DD"
): string {
  let jsonDate;
  if (date) jsonDate = new Date(date);
  else jsonDate = new Date();
  
  const year = jsonDate.getFullYear();
  const month = String(jsonDate.getMonth() + 1).padStart(2, '0');
  const day = String(jsonDate.getDate()).padStart(2, '0');
  
  if (format === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  }
  return `${year}-${month}-${day}`;
}

export function GetTime(
  date?: any,
  format: string = "HH:mm"
): string {
  if (!date) return '';
  
  // Parse time string like "12:30 PM" or "14:30"
  const timeStr = String(date);
  const is12Hour = timeStr.includes('AM') || timeStr.includes('PM');
  
  if (is12Hour) {
    // Parse 12-hour format "hh:mm A"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  } else {
    // Already in 24-hour format
    return timeStr;
  }
  
  return '';
}

export function GetTimeObject(
  date?: any,
  format: string = "HH:mm"
): Date | null {
  if (!date) return null;
  
  // Parse time string and return Date object with today's date
  const timeStr = String(date);
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today;
  }
  
  return null;
}


export function GetTimeWithAM_PM(
  date?: any,
  format: string = "hh:mm A"
): string {
  if (!date) return '';
  
  // Parse 24-hour format "HH:mm" and convert to 12-hour "hh:mm A"
  const timeStr = String(date);
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    
    return `${hours}:${minutes} ${ampm}`;
  }
  
  return '';
}

export function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
  b64Data = b64Data.split('base64,')[1];
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export function compare(a: Number | string, b: Number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


export const DDMMYYYY_DATE_FORMAT = {
  parse: {
    dateInput: ['LL', 'DD/MM/YYYY'],
  },
  display: {
    dateInput: "DD/MM/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY"
  },
}

//For Print Job code start
export function get_location_based_stock_list(job: any): any[] {
  let locationStockList = [];
  let ids = [];
  let stockList = [];
  if (job?.locationStockList?.length > 0) {
    job.locationStockList.forEach(element => {
      let obj = Get_job_location_stock_Obj(element);
      locationStockList.push(obj);
    });
  }
  return locationStockList;
}
export function Get_job_location_stock_Obj(element: any) {
  let quarantined = false;
  let packup_quarantined = false;
  let partly_used = false;
  if (element.job_location_stock.quarantine_id != null) quarantined = true;
  if (element.job_location_stock.pickup_quarantine_id != null) packup_quarantined = true;
  if (element.job_location_stock.partly_used_id != null) partly_used = true;
  let qty = element.job_location_stock.qty - parseInt(element.job_location_stock.movedQty)
    - (quarantined ? element.job_location_stock.quarantine_stock.qty : 0)
    - (packup_quarantined ? element.job_location_stock.pickup_quarantine_stock.qty : 0)
    - (partly_used ? element.job_location_stock.partly_used_stock.qty : 0);
  let obj = {
    address: element.job_id.address.street,
    stock_name: element.job_id.stockList[0].stock.name,
    stock_images: element.job_id.stockList[0].stock.images,
    job_location_stock_qty: qty
  }
  return obj
}

export function get_warehouse_stock_list(job: any): any[] {
  let warehouseStockList = [];
  if (job?.stockList?.length > 0) {
    job.stockList.forEach(element1 => {
      //if(element1.jobs_stock_variations.quarantine_id==null)
      {
        let obj = Get_jobs_stock_variations_Obj(element1);
        warehouseStockList.push(obj);
      }
    });
  }
  return warehouseStockList;
}
export function Get_jobs_stock_variations_Obj(element1: any) {
  let quarantined = false;
  let packup_quarantined = false;
  let partly_used = false;
  if (element1.jobs_stock_variations.quarantine_id != null) quarantined = true;
  if (element1.jobs_stock_variations.pickup_quarantine_id != null) packup_quarantined = true;
  if (element1.jobs_stock_variations.partly_used_id != null) partly_used = true;
  let qty = element1.jobs_stock_variations.qty - parseInt(element1.jobs_stock_variations.movedQty)
    - (quarantined ? element1.jobs_stock_variations.quarantine_stock.qty : 0)
    - (packup_quarantined ? element1.jobs_stock_variations.pickup_quarantine_stock.qty : 0)
    - (partly_used ? element1.jobs_stock_variations.partly_used_stock.qty : 0);
  let obj = {
    address: "Warehouse",
    stock_name: element1.stock.name,
    stock_images: element1.stock.images,
    job_location_stock_qty: qty
  }
  return obj;
}
export async function getJobDetailsTemplateForPdf(job: any) {
  let stockList: any[] = get_warehouse_stock_list(job);
  let locationStockList: any[] = get_location_based_stock_list(job);
  let allStocks = [];
  stockList.forEach(element => {
    allStocks.push({
      img: element?.stock_images[0]?.url,
      name: element?.stock_name,
      qty: element?.job_location_stock_qty
    })
  });
  locationStockList.forEach(element => {
    allStocks.push({
      img: element?.stock_images[0]?.url,
      name: element?.stock_name,
      qty: element?.job_location_stock_qty
    })
  });
  let jobDetailsTemplate = ` 
  <div  class="pdf-container">
    <div class="max-w-[100%] p-5">
    <div class="grid-container">
    <div class="w-100 flex">
   <div class="flex">
   <img src="../../../assets/img/logo_home.png" width="50" alt="logo" class="inline-block"/>
    <h1 class="text-[#ff7d00] font-bold text-2xl">Job Report</h1>
    </div>
    </div>
    <div class="border-1  border-[#e0e0e0] border-inherit border-collapse border mb-[10px] mt-[10px]"></div>
    <div class="w-100 text-lg">
    <h1 class="mb-[20px] text-[#ff7d00]  w-100">Job Details</h1>
    </div>
    <table class="w-[100%] border-1 border-[#e0e0e0] border rounded-[6px] overflow-hidden">
     <tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-2 pb-4">
     <span>
       Job
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">${job?.address?.street}, ${job?.address?.suburb}, ${job?.address?.state?.name} ${job?.address?.post_code} ${job?.address?.high_end_job ? '(High End)' : ''}</p>        
       </div>
      </td>
   </div> 
    </tr>
    <tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Sr Stylist
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">${job?.sr_stylist_id ? (job?.sr_stylist?.first_name + ' ' + job?.sr_stylist?.last_name) : ''}</p>        
       </div>
      </td>
   </div> 
    </tr>
    <tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Install Stylist
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">
     ${job?.install_stylists?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</p>        
       </div>
      </td>
   </div> 
    </tr>
    <tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Install Logistics
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">${job?.install_logistics?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</p>        
       </div>
      </td>
   </div> 
    </tr>`;
  if (job?.packup_stylists?.length > 0) {
    `<tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Packup Stylist
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">
     ${job?.packup_stylists?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</p>        
       </div>
      </td>
   </div> 
    </tr>`;
  }
  if (job?.packup_logistics?.length > 0) {
    `<tr class="text-left">
     <div class="text-base items-center">
     <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Packup Logistics
     </span></th>
     <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
     <div class="w-100">
     <p class="width-100 font-bold text-[#000]">
     ${job?.packup_logistics?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</p>        
       </div>
      </td>
   </div> 
    </tr>`;
  }
  jobDetailsTemplate += `<tr class="text-left">
<div class="text-base items-center">
     <div>
    <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
     <span>
       Real Estate Agent
     </span></th>
      <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4"> 
     <div class=" w-100 ">
      <p class="width-100 font-bold text-[#000]">${job?.jobcontact?.agent?.name != '' ? 'Agency name : ' + job?.jobcontact?.agent?.name : ''}</p> 
      <p class="width-100 font-bold text-[#000]">${job?.jobcontact?.agent?.contact_number != '' ? 'Contact number : ' + job?.jobcontact?.agent?.contact_number : ''}</p>
      <p class="width-100 font-bold text-[#000]">${job?.jobcontact?.agent?.email != '' ? 'Email : ' + job?.jobcontact?.agent?.email : ''}</p>
      </div>
       </td> 
   </div> 
   </div>
   </tr>`;
  if (job?.jobcontact?.homeowner_name != "") {
    jobDetailsTemplate += `<tr class="text-left">
    <div class="text-base items-center">
    <th class="border-[#e0e0e0] border text-[#000] font-[500] px-4 pb-4">
    <span>
      Home owner's details
    </span></th>
    <td colspan="3" class="border-[#e0e0e0] border px-4 pb-4">
    <div class="w-100">
    <p class="width-100 font-bold text-[#000]">${'Name : ' + job?.jobcontact?.homeowner_name}</p> 
    <p class="width-100 font-bold text-[#000]">${job?.jobcontact?.homeowner_contact_number != "" ? 'Contact number : ' + job?.jobcontact?.homeowner_contact_number : ''}</p>       
      <p class="width-100 font-bold text-[#000]">${job?.jobcontact?.homeowner_email != "" ? 'Email : ' + job?.jobcontact?.homeowner_email : ''}</p>   
    </div>
     </td>
  </div> 
   </tr>`;
  }

  jobDetailsTemplate += `<tr class="text-left">
<div class="w-100">
<div class="text-base items-center">

  <th class="border-[#e0e0e0] border text-[#000] font-[500] w-40 px-4 pb-4" >
    <span >
      Install Date
    </span>
</th>
 <td class="border-[#e0e0e0] border w-60 px-4 pb-4">
    <div
      class=" max-w-[110px] w-full"
    >
     
    <p class="font-bold text-[#000]">${GetDate(job?.install_date, "DD/MM/YYYY")}</p>
      
    </div>
    </td>
  </div>

  <div class="text-base items-center">
  <th class="border-[#e0e0e0] border text-[#000] w-40 px-4 pb-4 font-[500]">
    <span>
      Packup Date
    </span>
    </th>
    <td class="border-[#e0e0e0] border w-60 px-4 pb-4">
    <div
      class="max-w-[160px] w-full"
    >
    <p class="font-bold text-[#000]">${job?.pickup_date ? GetDate(job?.pickup_date, "DD/MM/YYYY") : ''}</p>
     
    </div></td>
 
</div>
  </div>
  </tr>
  </table>
   
<table class="w-[100%] overflow-hidden">
<div class="w-100 text-lg">
    <h1 class="mt-[20px] mb-[0px] text-[#ff7d00] w-100">${allStocks?.length > 0 ? 'Stock Details' : ''}</h1>
    </div>`;
  for (let i: number = 0; i < allStocks.length; i++) {
    let stock = allStocks[i];
    let img = await getBase64ImageFromUrl(stock?.img);
    jobDetailsTemplate += `
      <div class="grid grid-cols-4 gap-2 py-[40px]" style="border-bottom:1px solid #e0e0e0;">
        <div>
          <img src="${img || 'assets/img/Logo_black.png'}" class="w-[150px] h-[70px]"/></div>
         <div><p class="pl-3"><b>${stock?.name}</b></p>
        </div>      
        <div>
          <p class="">Quantity : </p></div>
          <div><p class="pl-5"><b>${stock?.qty}</b></p>
        </div>
      </div>
      `;
  }
  jobDetailsTemplate += `</table></div>
  </div>
  </div>
`;
  const pdfContent = `<div id="incidentDetails-pdf">${jobDetailsTemplate}</div>`;

  return pdfContent;
}
export async function getBase64ImageFromUrl(imageUrl) {
  try {
    if (imageUrl == "" || imageUrl == undefined) return "";
    var res = await fetch(imageUrl, {
      method: 'GET',
      headers: { "Cache-Control": 'no-cache' },
    });
    var blob = await res.blob();
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener("load", function () {
        const base64String = reader.result as string;
        if (base64String.startsWith('data:image/jpeg;base64,')) {
          resolve(base64String);
        } else {
          resolve(`data:image/jpeg;base64,${base64String.split(';base64,')[1]}`);
        }
        //resolve(reader.result);
      }, false);
      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(blob);
    })
  } catch (e) {
    console.log('getBase64ImageFromUrl', e)
    return ''
  }
}

//for print job new design
export async function getJobDetailsTemplateForPdf1(job: any) {
  let stockList: any[] = get_warehouse_stock_list(job);
  let locationStockList: any[] = get_location_based_stock_list1(job);
  let jobDetailsTemplate = ` 
  <div  class="pdf-container">
    <div class="max-w-[100%] py-2 px-[50px]">
    <div class="grid-container">
    <div class="w-100 flex ">        
         <div class="flex">  
          <h1 class="text-[#ff7d00] text-[28px]">${job?.address?.street}, ${job?.address?.suburb}, ${job?.address?.state?.name} ${job?.address?.post_code} ${job?.address?.high_end_job ? '(High End)' : ''}</h1>  
        </div>         
    </div>   
  
    <table >
     
    `;
  jobDetailsTemplate += `<tr class="text-left">
   <td  >
    <div class="lbl">
      Install Date
    </div>
</td>
 <td >
    <div >${GetDate(job?.install_date, "DD/MM/YYYY")}</div>
    
  </td>

  <td  >
    <div class="lbl">
      Logistics
    </div>
</td>
 <td >
    <div >${job?.install_logistics?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</div>
    </td>
  <td >
    <div class="lbl">
      Stylists
    </div>
    </td>
    <td >   
    <div >${job?.install_stylists?.map(type => type?.user?.first_name + " " + type?.user?.last_name)}</div>     
    </td>

  </tr>
  </table>`;
  if (stockList?.length > 0) {
    jobDetailsTemplate += `
    <div class="header-pdf  font-[200] text-[14px] text-[#ff7d00] w-100" style="font-weight:600;">Warehouse</div>
    <table >
    <tr class="text-left w-[100%]">    
     <th class="item-header"><div>Items</div></th>
     <th class="small-header"><div>Quantity</div></th>
     <th class="small-header"><div>Check</div></th>
     <th ><div>Comments</div></th>
     
    </tr>`;
    for (let i: number = 0; i < stockList.length; i++) {
      let stock = stockList[i];
      jobDetailsTemplate += `<tr class="text-left w-[100%]">
     
        <td ><div>${stock?.stock_name}</div></td>
        <td ><div>${stock?.job_location_stock_qty}</div></td>
        <td ><div></div></td>
        <td ><div></div></td>
    
      </tr>`;
    }
    jobDetailsTemplate += `</table>`;
  }
  if (locationStockList?.length > 0) {
    for (let j: number = 0; j < locationStockList.length; j++) {
      jobDetailsTemplate += `
      <div class="header-pdf  font-[200] text-[14px] text-[#ff7d00] w-100" style="font-weight:600;">${locationStockList[j]?.street_name}</div>
      <table >
      <tr class="text-left w-[100%]">
       
          <th class="item-header"><div>Items</div></th>
          <th class="small-header"><div>Quantity</div></th>
          <th class="small-header"><div>Check</div></th>
          <th ><div>Comments</div></th>
       
      </tr>`;
      let location_stocks = locationStockList[j]?.stock_list;
      for (let k: number = 0; k < location_stocks.length; k++) {
        let location_stock = location_stocks[k];
        jobDetailsTemplate += `<tr class="text-left w-[100%]">
       
          <td ><div>${location_stock?.stock_name}</div></td>
          <td ><div>${location_stock?.job_location_stock_qty}</div></td>
          <td ><div></div></td>
          <td ><div></div></td>
       
        </tr>`;
      }
      jobDetailsTemplate += `</table>`;
    }
  }
  jobDetailsTemplate += `</div></div></div>`;
  const pdfContent = `<div id="incidentDetails-pdf">${jobDetailsTemplate}</div>`;
  return pdfContent;
}
export function get_location_based_stock_list1(job: any): any[] {
  let locationStockList = [];
  let ids = [];
  let stockList = [];
  if (job.locationStockList.length > 0) {
    job.locationStockList.forEach(element => {
      //if(element.job_location_stock.quarantine_id==null)
      {
        if (ids.indexOf(element.job_id.id) < 0) {
          ids.push(element.job_id.id);
        }
        let obj = Get_job_location_stock_Obj1(element);
        stockList.push(obj);
      }
    });
    ids.forEach(a => {
      let st_lst=stockList.filter(c => c.job_id == a);
      st_lst.sort((a, b) => a.category_id - b.category_id);
      locationStockList.push({
        street_name: stockList.find(b => b.job_id == a).address,
        stock_list: st_lst
      })
    })
  }
  return locationStockList;
}
export function Get_job_location_stock_Obj1(element: any) {
  let quarantined = false;
  let packup_quarantined = false;
  let partly_used = false;
  if (element.job_location_stock.quarantine_id != null) quarantined = true;
  if (element.job_location_stock.pickup_quarantine_id != null) packup_quarantined = true;
  if (element.job_location_stock.partly_used_id != null) partly_used = true;
  let qty = element.job_location_stock.qty - parseInt(element.job_location_stock.movedQty)
    - (quarantined ? element.job_location_stock.quarantine_stock.qty : 0)
    - (packup_quarantined ? element.job_location_stock.pickup_quarantine_stock.qty : 0)
    - (partly_used ? element.job_location_stock.partly_used_stock.qty : 0);
  let obj = {
    job_id: element.job_id.id,
    address: element.job_id.address.street,
    stock_name: element.job_id.stockList[0].stock.name,
    category_id: element.job_id.stockList[0].stock?.category?.id,
    job_location_stock_qty: qty
  }
  return obj
}
//For Print Job code end
//For Print Switch out job code start
export async function getSwitchoutDetailsTemplateForPdf(job: any) {
  let jobDetailsTemplate = ` 
  <div  class="pdf-container">
    <div class="max-w-[100%] py-2 px-[50px]">
    <div class="grid-container">
    <div class="w-100 flex ">        
         <div class="flex">  
          <h1 class="text-[#ff7d00] text-[28px]">${job?.address?.street} (Switch Out)</h1>  
        </div>         
    </div>   
  
    <table >
     
    `;
  jobDetailsTemplate += `<tr class="text-left">
   <td  >
    <div class="lbl">
      Install Date
    </div>
</td>
 <td class="w-[100px]">
    <div >${GetDate(job?.install_date, "DD/MM/YYYY")}</div>
    
  </td>

  <td  >
    <div class="lbl">
      Switch Out Date
    </div>
</td>
 <td class="w-[100px]">
    <div >${GetDate(job?.switch_out_date, "DD/MM/YYYY")}</div>
    </td>
  <td >
    <div class="lbl">
      Packup Date
    </div>
    </td>
    <td class="w-[100px]">   
    <div >${job?.packup_date ? GetDate(job?.packup_date, "DD/MM/YYYY") : ''}</div>     
    </td>

  </tr>
  <tr class="text-left">
   <td>
    <div class="lbl">
      Logistics
    </div>
</td>
 <td colspan="2">
    <div >${job?.logistics?.map(type => type?.first_name + " " + type?.last_name)}</div>    
  </td>
  <td  >
    <div class="lbl">
      Stylists
    </div>
</td>
 <td colspan="2">
    <div >${job?.stylists?.map(type => type?.first_name + " " + type?.last_name)}</div>
    </td>

  </tr>
  <tr class="text-left">
   <td>
    <div class="lbl">
      Note
    </div>
</td>
 <td colspan="5">
    <div >${job?.note}</div>    
  </td>
  </tr>
  </table>`;
  let dropOffStock = [
    ...(job?.dropOffStock?.stocks ?? []),
    ...(job?.dropOffStock?.locationStockList ?? [])
  ];
  let originalRemoveStock = [
    ...(job?.originalRemoveStock?.stocks ?? []),
    ...(job?.originalRemoveStock?.locationStockList ?? [])
  ].filter(a=>a.isSelected);
  if (dropOffStock?.length > 0) {
    jobDetailsTemplate += `
    <div class="header-pdf  font-[200] text-[14px] text-[#ff7d00] w-100" style="font-weight:600;">Drop Off Stocks</div>
    <table >
    <tr class="text-left w-[100%]">    
     <th class="item-header-2"><div>Items</div></th>
     <th class="item-header-2"><div>Pickup Location</div></th>
     <th class="small-header"><div>Quantity</div></th>
     <th class="small-header"><div>Check</div></th>
     <th><div>Comments</div></th>
     
    </tr>`;
    for (let i: number = 0; i < dropOffStock.length; i++) {
      let stock = dropOffStock[i];
      jobDetailsTemplate += `<tr class="text-left w-[100%]">     
        <td><div>${stock?.name}</div></td>
        <td><div>${stock?.is_from_ware_house ? 'Warehouse' : stock?.job_name}</div></td>
        <td ><div>${stock?.qty}</div></td>
        <td ><div></div></td>
        <td ><div></div></td>    
      </tr>`;
    }
    jobDetailsTemplate += `</table>`;
  }
  if (originalRemoveStock?.length > 0) {
    jobDetailsTemplate += `
    <div class="header-pdf  font-[200] text-[14px] text-[#ff7d00] w-100" style="font-weight:600;">Packup Stocks</div>
    <table >
    <tr class="text-left w-[100%]">    
     <th class="item-header"><div>Items</div></th>
     <th class="small-header"><div>Quantity</div></th>
     <th class="small-header"><div>Check</div></th>
     <th ><div>Comments</div></th>
     
    </tr>`;
    for (let i: number = 0; i < originalRemoveStock.length; i++) {
      let stock = originalRemoveStock[i];
      jobDetailsTemplate += `<tr class="text-left w-[100%]">     
        <td ><div>${stock?.name}</div></td>
        <td ><div>${stock?.packup_qty}</div></td>
        <td ><div></div></td>
        <td ><div></div></td>    
      </tr>`;
    }
    jobDetailsTemplate += `</table>`;
  }
  jobDetailsTemplate += `</div></div></div>`;
  const pdfContent = `<div id="incidentDetails-pdf">${jobDetailsTemplate}</div>`;
  return pdfContent;
}